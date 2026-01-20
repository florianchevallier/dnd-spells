import { useSearchParams, Link } from "react-router";
import { User, ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { CharacterWithDetails } from "~/db/queries/characters.server";

interface CharacterFilterProps {
  characters: CharacterWithDetails[];
  selectedCharacterId: number | null;
  onChange: (characterId: number | null) => void;
  isLoggedIn: boolean;
}

export function CharacterFilter({
  characters,
  selectedCharacterId,
  onChange,
  isLoggedIn,
}: CharacterFilterProps) {
  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

  if (!isLoggedIn) {
    return (
      <Link to="/auth/login">
        <Button variant="outline" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Connexion pour filtrer</span>
          <span className="sm:hidden">Connexion</span>
        </Button>
      </Link>
    );
  }

  if (characters.length === 0) {
    return (
      <Link to="/characters/new">
        <Button variant="outline" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Creer un personnage</span>
          <span className="sm:hidden">Personnage</span>
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">
            {selectedCharacter ? selectedCharacter.name : "Personnage"}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {selectedCharacter && (
          <>
            <DropdownMenuItem onClick={() => onChange(null)}>
              <span className="text-stone-400">Aucun personnage</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {characters.map((character) => (
          <DropdownMenuItem
            key={character.id}
            onClick={() => onChange(character.id)}
            className={selectedCharacterId === character.id ? "bg-stone-800" : ""}
          >
            <div className="flex flex-col">
              <span className="font-medium">{character.name}</span>
              <span className="text-xs text-stone-400">
                {character.class.nomAffich} niveau {character.level}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/characters" className="w-full">
            Gerer les personnages
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
