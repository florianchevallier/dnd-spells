import { useState, useEffect } from "react";
import { Badge } from "~/components/ui/badge";
import { Markdown } from "~/components/ui/markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getSchoolColor, getLevelLabel } from "~/lib/constants";
import type { SpellWithClasses } from "~/db/queries/spells";
import { BookOpen, Clock, Hourglass, Target, Zap } from "lucide-react";

interface SpellDetailProps {
  spell: SpellWithClasses | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper function to get damage/effect value for a specific level
function getSpellLevelValue(spell: SpellWithClasses, level: number): string | null {
  const levelKey = `niv${level}` as keyof SpellWithClasses;
  return (spell[levelKey] as string) || null;
}

// Check if spell has higher level values
function hasHigherLevelValues(spell: SpellWithClasses): boolean {
  for (let i = spell.niveau + 1; i <= 9; i++) {
    if (getSpellLevelValue(spell, i)) return true;
  }
  return false;
}

export function SpellDetail({ spell, open, onOpenChange }: SpellDetailProps) {
  if (!spell) return null;

  const [castLevel, setCastLevel] = useState(spell.niveau);
  const schoolColor = getSchoolColor(spell.ecole);
  
  // Reset cast level when spell changes
  useEffect(() => {
    setCastLevel(spell.niveau);
  }, [spell.id, spell.niveau]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2 sm:gap-4 pr-6 sm:pr-8">
            <DialogTitle className="text-lg sm:text-xl leading-tight">{spell.nom}</DialogTitle>
            <Badge variant="level" className="shrink-0 text-xs sm:text-sm">
              {getLevelLabel(spell.niveau)}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-2">
            <Badge className={schoolColor}>
              {spell.ecole}
            </Badge>
            {spell.rituel && <Badge variant="ritual">Rituel</Badge>}
            {spell.concentration && <Badge variant="concentration">Concentration</Badge>}
          </div>
        </DialogHeader>

        {/* Cast Level Selector */}
        {hasHigherLevelValues(spell) && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-stone-900/50 rounded-lg border border-stone-800">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 w-full sm:w-auto">
              <label className="text-xs sm:text-sm font-medium text-amber-200 whitespace-nowrap">
                Sort lancé au niveau :
              </label>
              <Select
                value={castLevel.toString()}
                onValueChange={(value) => setCastLevel(parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 - spell.niveau }, (_, i) => spell.niveau + i).map(
                    (level) => (
                      <SelectItem key={level} value={level.toString()}>
                        Niveau {level}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            {getSpellLevelValue(spell, castLevel) && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-200">
                  {getSpellLevelValue(spell, castLevel)}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          {/* Spell info grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 text-sm">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-stone-400">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="font-medium text-xs">Temps</span>
              </div>
              <p className="text-stone-200 text-xs pl-4 sm:pl-6">
                {spell.tempsValeur} {spell.tempsUnite}
                {spell.tempsCondition && (
                  <span className="block text-stone-400 text-[10px] sm:text-xs mt-0.5">
                    {spell.tempsCondition}
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-stone-400">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="font-medium text-xs">Portée</span>
              </div>
              <p className="text-stone-200 text-xs pl-4 sm:pl-6">
                {spell.porteeType}
                {spell.porteeValeur && ` (${spell.porteeValeur})`}
                {spell.porteeForme && (
                  <span className="block text-stone-400 text-[10px] sm:text-xs mt-0.5">
                    {spell.porteeForme}
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-stone-400">
                <Hourglass className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="font-medium text-xs">Durée</span>
              </div>
              <p className="text-stone-200 text-xs pl-4 sm:pl-6">
                {spell.dureeValeur && (
                  <span className="block text-[10px] sm:text-xs mt-0.5">
                    {spell.dureeValeur} {spell.dureeUnite}
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-stone-400">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="font-medium text-xs">Composantes</span>
              </div>
              <p className="text-stone-200 text-xs pl-4 sm:pl-6">
                {spell.composantes}
                {spell.materiaux && (
                  <span className="block text-stone-400 text-[10px] sm:text-xs mt-0.5">
                    ({spell.materiaux})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Classes */}
          {spell.classes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-stone-400 text-xs sm:text-sm">
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="font-medium">Classes</span>
              </div>
              <div className="flex flex-wrap gap-1 pl-5 sm:pl-6">
                {spell.classes.map((className) => (
                  <Badge key={className} variant="secondary">
                    {className}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {spell.description && (
            <div className="space-y-2 pt-2 border-t border-stone-800">
              <h4 className="font-medium text-amber-200 text-sm sm:text-base">Description</h4>
              <Markdown>{spell.description}</Markdown>
            </div>
          )}

          {/* Higher levels */}
          {spell.niveauxSupTxt && (
            <div className="space-y-2 pt-2 border-t border-stone-800">
              <h4 className="font-medium text-amber-200 text-sm sm:text-base">A plus haut niveau</h4>
              <Markdown>{spell.niveauxSupTxt}</Markdown>
            </div>
          )}

          {/* Source */}
          {spell.source && (
            <div className="pt-2 border-t border-stone-800">
              <p className="text-xs text-stone-500">
                Source: {spell.source}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
