#!/usr/bin/env node

/**
 * Codex converter: aidedd-monstre.html -> CSV
 *
 * Design goals (lean DB export):
 * - Keep only durable, useful data columns for DB import.
 * - Preserve text hierarchy in JSON (sections/items), without style coupling.
 * - Keep one final image URL per monster.
 *
 * Usage:
 *   node scripts/html-to-csv-monsters-codex.js [input.html] [output.csv]
 */

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const inputFile = process.argv[2] || './aidedd-monstre.html';
const outputFile = process.argv[3] || './monstres-codex.csv';
const verifyImages = process.env.VERIFY_IMAGES === '1';
const imageCachePath = process.env.IMAGE_CACHE_PATH || './monster-image-cache.json';

if (!fs.existsSync(inputFile)) {
  console.error(`Input file not found: ${inputFile}`);
  process.exit(1);
}

const sourceHtml = fs.readFileSync(inputFile, 'utf8');
const blocks = extractCardBlocks(sourceHtml);
const knownImageSlugs = extractKnownImageSlugs(sourceHtml);
const imageCache = loadImageCache(imageCachePath);

if (blocks.length === 0) {
  console.error('No cards found.');
  process.exit(1);
}

const rows = [];
for (let i = 0; i < blocks.length; i++) {
  // Sequential parsing allows optional network validation without flooding.
  // eslint-disable-next-line no-await-in-loop
  const row = await parseCard(blocks[i], i + 1, knownImageSlugs, imageCache, verifyImages);
  rows.push(row);
}
writeCsv(rows, outputFile);
saveImageCache(imageCachePath, imageCache);

console.log(`Cards: ${rows.length}`);
console.log(`CSV: ${path.resolve(outputFile)}`);

function extractCardBlocks(html) {
  const exactBlocChunks = extractBlocChunks(html);
  if (exactBlocChunks.length > 0) {
    return exactBlocChunks;
  }

  // Fallback if class names change: derive chunks from H1 containers.
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const h1s = Array.from(doc.querySelectorAll('h1'));
  return h1s.map((h1) => {
    const node = h1.parentElement || h1;
    return node.outerHTML || '';
  }).filter(Boolean);
}

function extractBlocChunks(source) {
  const chunks = [];
  let cursor = 0;

  while (cursor < source.length) {
    const start = source.indexOf('<div', cursor);
    if (start === -1) break;

    const tagEnd = source.indexOf('>', start);
    if (tagEnd === -1) break;

    const openTag = source.slice(start, tagEnd + 1);
    if (!/\bclass\s*=\s*(['"])[^'"]*\bbloc\b[^'"]*\1/i.test(openTag)) {
      cursor = tagEnd + 1;
      continue;
    }

    const end = findMatchingDivEnd(source, start);
    if (end === -1) break;

    chunks.push(source.slice(start, end));
    cursor = end;
  }

  return chunks;
}

function findMatchingDivEnd(source, startIndex) {
  let depth = 0;
  let i = startIndex;

  while (i < source.length) {
    const lt = source.indexOf('<', i);
    if (lt === -1) return -1;

    if (source.startsWith('<!--', lt)) {
      const cEnd = source.indexOf('-->', lt + 4);
      if (cEnd === -1) return -1;
      i = cEnd + 3;
      continue;
    }

    const gt = source.indexOf('>', lt + 1);
    if (gt === -1) return -1;

    if (source.startsWith('<div', lt)) depth += 1;
    if (source.startsWith('</div', lt)) {
      depth -= 1;
      if (depth === 0) return gt + 1;
    }

    i = gt + 1;
  }

  return -1;
}

async function parseCard(rawBlocHtml, ordinal, knownSlugs, imageCache, shouldVerifyImages) {
  const dom = new JSDOM(rawBlocHtml);
  const doc = dom.window.document;

  const root = doc.querySelector('div.bloc') || doc.body.firstElementChild || doc.body;
  const h1 = root.querySelector('h1');
  const rootCard = h1?.parentElement || root;
  const contentRoot = rootCard.querySelector('.sansSerif') || rootCard;
  const red = contentRoot.querySelector('.red');
  const descriptionDiv = root.querySelector('.description');
  const tradRaw = normalizeText(rootCard.querySelector('.trad')?.textContent || '');
  const tradList = parseTradList(tradRaw);
  const image = await extractImage(
    root,
    { name: normalizeText(h1?.textContent || ''), tradList },
    knownSlugs,
    imageCache,
    shouldVerifyImages
  );

  const name = normalizeText(h1?.textContent || '');
  const type = normalizeText(contentRoot.querySelector('.type')?.textContent || '');
  const details = extractDetails(red);
  const abilities = extractAbilities(red);
  const sections = extractSections(contentRoot);
  const links = extractLinks(contentRoot);

  const descriptionText = normalizeText(descriptionDiv?.textContent || '');
  const imageUrlFinal = image.url || image.inferredUrl;

  return {
    ordinal,
    name,
    type,
    trad_raw: tradRaw,
    trad_json: JSON.stringify(tradList),
    ac: details["Classe d'armure"] || '',
    hp: details['Points de vie'] || '',
    speed: details['Vitesse'] || '',
    str: abilities.FOR.score,
    dex: abilities.DEX.score,
    con: abilities.CON.score,
    int: abilities.INT.score,
    wis: abilities.SAG.score,
    cha: abilities.CHA.score,
    str_mod: abilities.FOR.mod,
    dex_mod: abilities.DEX.mod,
    con_mod: abilities.CON.mod,
    int_mod: abilities.INT.mod,
    wis_mod: abilities.SAG.mod,
    cha_mod: abilities.CHA.mod,
    details_json: JSON.stringify(details),
    sections_json: JSON.stringify(sections),
    description_text: descriptionText,
    image_url: imageUrlFinal,
    links_json: JSON.stringify(links),
  };
}

function extractDetails(redDiv) {
  const out = {};
  if (!redDiv) return out;

  const labels = [
    "Classe d'armure",
    'Points de vie',
    'Vitesse',
    'Jets de sauvegarde',
    'Compétences',
    'Vulnérabilités aux dégâts',
    'Résistances aux dégâts',
    'Immunités aux dégâts',
    'Immunités aux états',
    'Sens',
    'Langues',
    'Puissance',
  ];

  const labelSet = new Set(labels);
  let currentLabel = '';
  const values = new Map();

  for (const node of Array.from(redDiv.childNodes)) {
    if (node.nodeType === 1) {
      const el = node;

      if (el.tagName === 'STRONG') {
        const label = normalizeText(el.textContent || '');
        currentLabel = labelSet.has(label) ? label : '';
        if (currentLabel && !values.has(currentLabel)) values.set(currentLabel, '');
        continue;
      }

      if (el.tagName === 'DIV' || el.tagName === 'BR') continue;
    }

    if (!currentLabel) continue;
    const text = normalizeText(node.textContent || '');
    if (!text) continue;
    const prev = values.get(currentLabel) || '';
    values.set(currentLabel, normalizeText(`${prev} ${text}`));
  }

  for (const [label, value] of values.entries()) {
    if (value) out[label] = value;
  }

  return out;
}

function extractAbilities(redDiv) {
  const blank = { score: '', mod: '' };
  const map = {
    FOR: { ...blank },
    DEX: { ...blank },
    CON: { ...blank },
    INT: { ...blank },
    SAG: { ...blank },
    CHA: { ...blank },
  };

  if (!redDiv) return map;

  for (const node of Array.from(redDiv.querySelectorAll('.carac'))) {
    const abbr = normalizeText(node.querySelector('strong')?.textContent || '');
    const txt = normalizeText(node.textContent || '');
    const m = txt.match(/(\d+)\s*\(([+\-−]?\d+)\)/);
    if (!map[abbr] || !m) continue;
    map[abbr].score = m[1];
    map[abbr].mod = m[2].replace('−', '-');
  }

  return map;
}

function extractSections(cardRoot) {
  if (!cardRoot) return [];

  const sections = [];
  let current = { title: 'Traits', entries: [] };
  sections.push(current);

  let looseTextBuffer = [];

  const flushLooseText = () => {
    const text = normalizeText(looseTextBuffer.join(' '));
    if (!text) {
      looseTextBuffer = [];
      return;
    }
    current.entries.push({ kind: 'paragraph', name: '', text });
    looseTextBuffer = [];
  };

  for (const node of Array.from(cardRoot.childNodes)) {
    if (node.nodeType === 3) {
      const text = normalizeText(node.textContent || '');
      if (text) looseTextBuffer.push(text);
      continue;
    }

    if (node.nodeType !== 1) continue;
    const el = node;

    if (el.tagName === 'BR') {
      flushLooseText();
      continue;
    }

    if (el.tagName === 'H1' || el.classList?.contains('type') || el.classList?.contains('red') || el.tagName === 'SVG') {
      continue;
    }

    if (el.classList?.contains('rub')) {
      flushLooseText();
      current = {
        title: normalizeText(el.textContent || '') || 'Section',
        entries: [],
      };
      sections.push(current);
      continue;
    }

    if (el.tagName === 'P') {
      flushLooseText();
      current.entries.push({
        kind: 'paragraph',
        name: normalizeText(el.querySelector('strong')?.textContent || ''),
        text: normalizeText(el.textContent || ''),
      });
      continue;
    }

    flushLooseText();
    const text = normalizeText(el.textContent || '');
    if (!text) continue;
    current.entries.push({
      kind: 'block',
      name: '',
      text,
    });
  }

  flushLooseText();
  return sections;
}

function parseTradList(tradRaw) {
  if (!tradRaw) return [];
  const matches = [...tradRaw.matchAll(/\[([^\]]+)\]/g)];
  if (matches.length === 0) return [tradRaw];
  return matches.map((m) => normalizeText(m[1])).filter(Boolean);
}

async function extractImage(root, context, knownSlugs, imageCache, shouldVerifyImages) {
  const img = root.querySelector('.picture img');
  const explicitUrl = normalizeImageUrl(img?.getAttribute('src') || '');
  const alt = normalizeText(img?.getAttribute('alt') || '');
  const title = normalizeText(img?.getAttribute('title') || '');
  const width = normalizeText(img?.getAttribute('width') || '');
  const height = normalizeText(img?.getAttribute('height') || '');

  const cacheKey = buildImageCacheKey(context.name);
  const cachedUrl = normalizeImageUrl(imageCache[cacheKey] || '');
  if (cachedUrl && !isNpcImageUrl(cachedUrl)) {
    return {
      url: '',
      inferredUrl: cachedUrl,
      source: 'cache',
      alt,
      title,
      width,
      height,
      candidates: [],
    };
  }

  const slugs = buildImageSlugCandidates(context.name, context.tradList, explicitUrl);
  const orderedSlugs = prioritizeKnownSlugs(slugs, knownSlugs);
  const candidates = orderedSlugs
    .map((slug) => `https://www.aidedd.org/dnd/images/${slug}.jpg`)
    .filter((url) => !isNpcImageUrl(url));

  let inferredUrl = '';
  let source = 'none';

  const sanitizedExplicit = explicitUrl && !isNpcImageUrl(explicitUrl) ? explicitUrl : '';

  if (shouldVerifyImages) {
    const urlsToTry = [...(sanitizedExplicit ? [sanitizedExplicit] : []), ...candidates];
    inferredUrl = await firstReachableImage(urlsToTry);
    source = inferredUrl ? (inferredUrl === sanitizedExplicit ? 'explicit' : 'inferred') : 'none';
  } else {
    inferredUrl = sanitizedExplicit || candidates[0] || '';
    source = inferredUrl ? (inferredUrl === sanitizedExplicit ? 'explicit' : 'inferred') : 'none';
  }

  if (inferredUrl) {
    imageCache[cacheKey] = inferredUrl;
  }

  return {
    url: sanitizedExplicit,
    inferredUrl,
    source,
    alt,
    title,
    width,
    height,
    candidates,
  };
}

function buildImageSlugCandidates(name, tradList, explicitUrl) {
  const values = [];
  const explicitSlug = explicitUrl
    ? explicitUrl.replace(/^.*\/([^/?#]+)\.[^.]+(?:[?#].*)?$/, '$1')
    : '';
  if (explicitSlug && explicitSlug !== explicitUrl) values.push(explicitSlug);

  for (const trad of tradList) {
    values.push(...inferCanonicalSlugs(trad));
    values.push(slugify(trad));
  }
  values.push(...inferCanonicalSlugs(name));
  values.push(slugify(name));

  return [...new Set(values.filter(Boolean))];
}

function prioritizeKnownSlugs(slugs, knownSlugs) {
  if (!knownSlugs || knownSlugs.size === 0) return slugs;
  const known = [];
  const unknown = [];
  for (const slug of slugs) {
    if (knownSlugs.has(slug)) known.push(slug);
    else unknown.push(slug);
  }
  return known.length > 0 ? [...known, ...unknown] : slugs;
}

function inferCanonicalSlugs(value) {
  const normalized = slugify(value);
  if (!normalized) return [];

  const out = [];

  const dragonEn = normalized.match(/^(adult|young|ancient|wyrmling)-(.+)-dragon$/);
  if (dragonEn) out.push(`${dragonEn[2]}-dragon`);

  const dragonFr = normalized.match(/^dragon-([a-z0-9-]+)-(adulte|jeune|venerable|ancien|antique|dragonet)$/);
  if (dragonFr) out.push(`${dragonFr[1]}-dragon`);

  return out;
}

function extractKnownImageSlugs(html) {
  const set = new Set();
  const re = /<img[^>]+src=['"]([^'"]+)['"]/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const normalized = normalizeImageUrl(match[1]);
    const slug = normalized.replace(/^.*\/([^/?#]+)\.[^.]+(?:[?#].*)?$/, '$1');
    if (slug && slug !== normalized) set.add(slug);
  }
  return set;
}

function normalizeImageUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  try {
    return new URL(trimmed, 'https://www.aidedd.org/dnd/').toString();
  } catch {
    return trimmed;
  }
}

function isNpcImageUrl(url) {
  return /\/pnj\//i.test(url);
}

function buildImageCacheKey(name) {
  return slugify(name);
}

function loadImageCache(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveImageCache(filePath, cache) {
  try {
    fs.writeFileSync(filePath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
  } catch {
    // Non-blocking: CSV generation should not fail because cache write fails.
  }
}

async function firstReachableImage(urls) {
  for (const url of urls) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await isReachableImage(url);
    if (ok) return url;
  }
  return '';
}

async function isReachableImage(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) return false;
    const contentType = response.headers.get('content-type') || '';
    return contentType.toLowerCase().startsWith('image/');
  } catch {
    return false;
  }
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function extractLinks(root) {
  if (!root) return [];
  return Array.from(root.querySelectorAll('a')).map((a) => ({
    href: a.getAttribute('href') || '',
    text: normalizeText(a.textContent || ''),
  }));
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function writeCsv(records, target) {
  const headers = [
    'ordinal',
    'name',
    'type',
    'trad_raw',
    'trad_json',
    'ac',
    'hp',
    'speed',
    'str',
    'dex',
    'con',
    'int',
    'wis',
    'cha',
    'str_mod',
    'dex_mod',
    'con_mod',
    'int_mod',
    'wis_mod',
    'cha_mod',
    'details_json',
    'sections_json',
    'description_text',
    'image_url',
    'links_json',
  ];

  let csv = `${headers.join(',')}\n`;
  for (const rec of records) {
    csv += `${headers.map((h) => csvEscape(rec[h])).join(',')}\n`;
  }

  fs.writeFileSync(target, csv, 'utf8');
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
