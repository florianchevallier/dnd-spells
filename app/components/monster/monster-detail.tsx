import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import type { MonsterWithContent } from "~/db/queries/monsters.server";
import { FavoriteMonsterButton } from "~/components/favorites/favorite-monster-button";
import { MonsterImage, type ImageStatus } from "./monster-image";
import { Button } from "~/components/ui/button";
import { Expand, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MonsterDetailProps {
  monster: MonsterWithContent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFavorite?: boolean;
  isLoggedIn?: boolean;
}

function statCell(label: string, score: number | null, mod: string | null) {
  return (
    <div className="rounded-md border border-stone-800 bg-stone-900 p-2 text-center">
      <div className="text-[10px] text-stone-400">{label}</div>
      <div className="text-sm font-semibold text-stone-200">
        {score ?? "-"} {mod ? `(${mod})` : ""}
      </div>
    </div>
  );
}

export function MonsterDetail({
  monster,
  open,
  onOpenChange,
  isFavorite = false,
  isLoggedIn = false,
}: MonsterDetailProps) {
  if (!monster) return null;

  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [showImageBlock, setShowImageBlock] = useState(Boolean(monster.imageUrl));
  const detailsEntries = Object.entries(monster.details);

  useEffect(() => {
    setShowImageBlock(Boolean(monster.imageUrl));
  }, [monster.id, monster.imageUrl]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const el = imageContainerRef.current;
      setIsImageFullscreen(!!el && document.fullscreenElement === el);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const toggleImageFullscreen = async () => {
    const el = imageContainerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else if (!document.fullscreenElement) {
        await el.requestFullscreen();
      }
    } catch {
      // Ignore if fullscreen is unavailable.
    }
  };

  const handleImageStatusChange = (status: ImageStatus) => {
    if (status === "failed" || status === "missing") {
      setShowImageBlock(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <DialogTitle className="text-xl">{monster.name}</DialogTitle>
              <Badge variant="outline" className="mt-2">
                {monster.type}
              </Badge>
            </div>
            <FavoriteMonsterButton
              monsterId={monster.id}
              isFavorite={isFavorite}
              isLoggedIn={isLoggedIn}
              size="default"
              showLabel
            />
          </div>
        </DialogHeader>

        {showImageBlock && monster.imageUrl ? (
          <div
            ref={imageContainerRef}
            className="relative z-0 isolate rounded-lg overflow-hidden border border-stone-800 h-56 sm:h-72 bg-stone-900"
          >
            <MonsterImage
              src={monster.imageUrl}
              alt={monster.name}
              fit="contain"
              className="bg-stone-900"
              onClick={toggleImageFullscreen}
              fallbackMode="none"
              onStatusChange={handleImageStatusChange}
            />
            <div className="absolute top-2 right-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 bg-stone-900/80 border border-stone-700 text-stone-100"
                onClick={toggleImageFullscreen}
              >
                {isImageFullscreen ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5 mr-1" />
                    Réduire
                  </>
                ) : (
                  <>
                    <Expand className="h-3.5 w-3.5 mr-1" />
                    Plein écran
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="relative z-10 space-y-5 bg-stone-950">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {statCell("FOR", monster.str, monster.strMod)}
            {statCell("DEX", monster.dex, monster.dexMod)}
            {statCell("CON", monster.con, monster.conMod)}
            {statCell("INT", monster.int, monster.intMod)}
            {statCell("SAG", monster.wis, monster.wisMod)}
            {statCell("CHA", monster.cha, monster.chaMod)}
          </div>

          {detailsEntries.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {detailsEntries.map(([label, value]) => (
                <div key={label} className="rounded-md border border-stone-800 bg-stone-900 p-2">
                  <div className="text-stone-400 text-xs">{label}</div>
                  <div className="text-stone-200">{value}</div>
                </div>
              ))}
            </div>
          )}

          {monster.sections.map((section) => (
            <div key={section.title} className="space-y-2 pt-2 border-t border-stone-800">
              <h3 className="text-amber-200 font-semibold">{section.title}</h3>
              <div className="space-y-2">
                {section.entries.map((entry, idx) => (
                  <p key={`${section.title}-${idx}`} className="text-sm text-stone-200 leading-relaxed">
                    {entry.name ? (
                      <span className="font-semibold text-amber-100">{entry.name} </span>
                    ) : null}
                    {entry.text}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {monster.descriptionText && (
            <div className="space-y-2 pt-2 border-t border-stone-800">
              <h3 className="text-amber-200 font-semibold">Description</h3>
              <p className="text-sm text-stone-200 leading-relaxed">{monster.descriptionText}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
