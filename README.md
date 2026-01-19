# Grimoire D&D 5e

Application web de recherche de sorts D&D 5e (490 sorts en français) avec filtres par Classe et Niveau.

## Stack technique

- **Frontend**: React Router v7 (SSR)
- **Base de données**: MariaDB
- **ORM**: Drizzle ORM
- **UI**: Tailwind CSS + shadcn/ui
- **Déploiement**: Docker

---

## 🚀 Démarrage rapide (Développement local)

### 1. Lancer MariaDB + phpMyAdmin avec Docker

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Cela lance :
- **MariaDB** sur `localhost:3306`
- **phpMyAdmin** sur http://localhost:8080

Credentials :
- User: `root`
- Password: `devpassword`
- Database: `dnd_spells`

### 2. Installer les dépendances

```bash
npm install
```

### 3. Importer les sorts depuis le CSV

```bash
npm run seed ../grimoire_dnd_structured_final.csv
```

Cela va :
- Créer les tables (spells, classes, spell_classes)
- Importer les 490 sorts
- Créer les relations entre sorts et classes

✅ Vérifie dans **phpMyAdmin** (http://localhost:8080) que les données sont bien importées !

### 4. Lancer l'application en mode dev

```bash
npm run dev
```

L'app est accessible sur **http://localhost:5173**

---

## 🐳 Déploiement en production

### CI/CD automatique (GitHub Actions)

Le projet utilise GitHub Actions pour automatiser le déploiement :

1. **Push un tag de version** :
```bash
git tag v1.0.0
git push origin v1.0.0
```

2. GitHub Actions va automatiquement :
   - Valider le code (typecheck + build)
   - Builder l'image Docker en multi-stage
   - Pousser vers le registry Docker (`registry.paladin.ovh`)
   - Déclencher le déploiement via webhook

**Secrets GitHub requis** :
- `REGISTRY_PASSWORD` : Authentification Docker registry
- `UPDATE_TOKEN` : Token pour le webhook de déploiement

### Déploiement manuel avec Docker Compose

#### Configuration initiale

1. **Créer le réseau Traefik** (première fois seulement) :
```bash
docker network create traefik-network
```

2. **Configurer les variables d'environnement** :
```bash
cp .env.production.example .env
# Éditer .env avec vos valeurs
```

Variables requises :
```env
DB_PASSWORD=<mot_de_passe_securise>
DB_ROOT_PASSWORD=<mot_de_passe_root>
TRAEFIK_HOST=dnd-spells.yourdomain.com
```

#### Lancement

```bash
# Build et démarrage (avec Traefik + Let's Encrypt SSL)
docker-compose -f docker-compose.prod.yml up -d

# Voir les logs
docker-compose -f docker-compose.prod.yml logs -f app

# Arrêter
docker-compose -f docker-compose.prod.yml down
```

**Notes** :
- Les migrations Drizzle sont exécutées automatiquement au démarrage
- SSL/TLS configuré automatiquement via Traefik + Let's Encrypt
- Logs avec rotation automatique (10MB max, 3 fichiers)
- Redémarrage automatique en cas d'échec

---

## 📁 Structure du projet

```
dnd-spells/
├── app/
│   ├── components/
│   │   ├── ui/              # Composants shadcn/ui
│   │   ├── spell/           # spell-card, spell-list, spell-detail
│   │   ├── filters/         # Filtres de recherche
│   │   └── layout/          # Header, footer
│   ├── db/
│   │   ├── schema.ts        # Schéma Drizzle (spells, classes, spell_classes)
│   │   ├── index.ts         # Connexion base de données
│   │   └── queries/         # Requêtes avec filtres
│   ├── lib/                 # Utilitaires et constantes
│   ├── routes/              # Routes React Router
│   └── app.css              # Thème dark fantasy
├── scripts/
│   └── seed.ts              # Script d'import CSV
├── docker-compose.yml       # Production (app + db)
└── docker-compose.dev.yml   # Dev local (db + phpMyAdmin)
```

---

## 🎯 Fonctionnalités

- ✅ **Filtres multi-sélection** : Classes et Niveaux
- ✅ **Recherche textuelle** : Par nom et description
- ✅ **État dans l'URL** : `/spells?class=magicien&level=1&level=2`
- ✅ **Modal de détail** : Description complète du sort
- ✅ **Thème dark fantasy** : Badges colorés par école de magie
- ✅ **Responsive** : Mobile et desktop

---

## 🛠️ Scripts disponibles

```bash
npm run dev         # Lance l'app en mode développement
npm run build       # Build pour production
npm run start       # Lance la version buildée
npm run typecheck   # Vérification TypeScript
npm run seed        # Importe les sorts depuis CSV
npm run db:studio   # Ouvre Drizzle Studio (GUI base de données)
```

---

## 🔧 Configuration

### Variables d'environnement (.env)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=devpassword
DB_NAME=dnd_spells
```

---

## 📊 Base de données

### Tables

**spells** : 490 sorts avec tous les détails (nom, niveau, école, description, composantes, etc.)

**classes** : 8 classes D&D (Barde, Clerc, Druide, Ensorceleur, Magicien, Occultiste, Paladin, Rôdeur)

**spell_classes** : Relations many-to-many entre sorts et classes

### Index et optimisations

- Index sur `niveau` et `ecole`
- Index composite sur `(niveau, ecole)`
- FULLTEXT sur `nom` et `description` pour la recherche

---

## 📝 Format du CSV

Le CSV doit contenir les colonnes suivantes :
- Nom, Niveau, Ecole, Rituel, Concentration
- Temps_Valeur, Temps_Unite, Temps_Condition
- Portee_Type, Portee_Valeur, Portee_Unite, Portee_Forme
- Duree_Type, Duree_Valeur, Duree_Unite
- Composantes, Materiaux
- Niv_1 à Niv_9 (scaling des dégâts/effets)
- Classes (séparées par des virgules)
- Source, Description, Niveaux_Sup_Txt

---

## 🎨 Thème

Palette de couleurs dark fantasy :
- Fond : Dégradé noir/brun `#0f0d0a`
- Accents : Or/Ambre `#c9a227`
- Bordures : Pierre sombre `#2d2820`
- Texte : Parchemin `#e8e0d4`

Couleurs par école de magie :
- Abjuration : Bleu
- Divination : Violet
- Enchantement : Rose
- Évocation : Rouge
- Illusion : Violet foncé
- Invocation : Ambre
- Nécromancie : Émeraude
- Transmutation : Orange

---

## 🔍 Accès aux outils

- **App dev** : http://localhost:5173
- **App prod** : http://localhost:3000
- **phpMyAdmin** : http://localhost:8080 (user: root, pass: devpassword)

---

## 📄 Licence

Ce projet utilise des données extraites des sources officielles D&D.
Dungeons & Dragons est une marque déposée de Wizards of the Coast.
