import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getSchoolColor, getLevelLabel } from "~/lib/constants";
import type { SpellWithClasses } from "~/db/queries/spells";
import { Clock, Target, Zap } from "lucide-react";

interface SpellCardProps {
  spell: SpellWithClasses;
  onClick?: () => void;
}

export function SpellCard({ spell, onClick }: SpellCardProps) {
  const schoolColor = getSchoolColor(spell.ecole);

  return (
    <Card
      className="cursor-pointer transition-all hover:border-amber-700 hover:shadow-amber-900/20 hover:shadow-xl group flex flex-col h-full"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base group-hover:text-amber-200 transition-colors line-clamp-2 flex-1 min-w-0">
            {spell.nom}
          </CardTitle>
          <Badge variant="level" className="shrink-0">
            {getLevelLabel(spell.niveau)}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap min-h-[24px]">
          <Badge className={schoolColor}>
            {spell.ecole}
          </Badge>
          {spell.rituel && <Badge variant="ritual">Rituel</Badge>}
          {spell.concentration && <Badge variant="concentration">Concentration</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-stone-400">
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className="h-3 w-3 text-stone-500 shrink-0" />
            <span className="truncate">
              {spell.tempsValeur} {spell.tempsUnite}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Target className="h-3 w-3 text-stone-500 shrink-0" />
            <span className="truncate">
              {spell.porteeType}<br />
              {spell.porteeValeur ? `${spell.porteeValeur} ${spell.porteeUnite}${spell.porteeValeur > 1 ? "s" : ""}` : ""}
            </span>
          </div>
          {spell.composantes && (
            <div className="flex items-center gap-1.5 min-w-0 col-span-2">
              <Zap className="h-3 w-3 text-stone-500 shrink-0" />
              <span className="truncate">{spell.composantes}</span>
            </div>
          )}
        </div>
        {spell.classes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {spell.classes.slice(0, 3).map((className) => (
              <Badge key={className} variant="outline" className="text-xs">
                {className}
              </Badge>
            ))}
            {spell.classes.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{spell.classes.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
