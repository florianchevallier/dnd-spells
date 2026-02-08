import { ImageOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "~/lib/utils";

export type ImageStatus = "unknown" | "ok" | "failed" | "missing";

const CACHE_KEY = "monster_image_status_v1";
const memoryCache = new Map<string, ImageStatus>();

function readStorageCache(): Record<string, ImageStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ImageStatus>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorageCache(cache: Record<string, ImageStatus>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Non-blocking cache write
  }
}

function getCachedStatus(src: string | null | undefined): ImageStatus {
  if (!src) return "missing";
  if (memoryCache.has(src)) return memoryCache.get(src)!;
  const storage = readStorageCache();
  const status = storage[src];
  if (status) {
    memoryCache.set(src, status);
    return status;
  }
  return "unknown";
}

function setCachedStatus(src: string, status: ImageStatus) {
  memoryCache.set(src, status);
  const storage = readStorageCache();
  storage[src] = status;
  writeStorageCache(storage);
}

interface MonsterImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  fit?: "cover" | "contain";
  onClick?: () => void;
  fallbackMode?: "placeholder" | "none";
  onStatusChange?: (status: ImageStatus) => void;
}

export function MonsterImage({
  src,
  alt,
  className,
  wrapperClassName,
  fit = "contain",
  onClick,
  fallbackMode = "none",
  onStatusChange,
}: MonsterImageProps) {
  const normalizedSrc = useMemo(() => (src || "").trim(), [src]);
  const [status, setStatus] = useState<ImageStatus>(() => getCachedStatus(normalizedSrc));

  useEffect(() => {
    setStatus(getCachedStatus(normalizedSrc));
  }, [normalizedSrc]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const showFallback = !normalizedSrc || status === "failed" || status === "missing";

  if (showFallback) {
    if (fallbackMode === "none") return null;
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-stone-900 text-stone-500",
          wrapperClassName
        )}
      >
        <div className="flex flex-col items-center gap-2 text-xs">
          <ImageOff className="h-5 w-5" />
          <span>Pas d'image</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={normalizedSrc}
      alt={alt}
      className={cn(
        "h-full w-full",
        fit === "contain" ? "object-contain" : "object-cover",
        onClick ? "cursor-zoom-in" : "",
        className
      )}
      loading="lazy"
      onClick={onClick}
      onLoad={() => {
        setStatus("ok");
        setCachedStatus(normalizedSrc, "ok");
      }}
      onError={() => {
        setStatus("failed");
        setCachedStatus(normalizedSrc, "failed");
      }}
    />
  );
}
