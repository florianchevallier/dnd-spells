import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/spells.prepared";
import { requireAuth } from "~/lib/requireAuth.server";
import {
  getCharactersByUserId,
  getCharacterById,
  type CharacterWithDetails,
} from "~/db/queries/characters.server";
import { getPreparedSpellsByCharacter } from "~/db/queries/prepared-spells.server";
import type { SpellWithClasses } from "~/db/queries/spells.server";
import { SpellList } from "~/components/spell/spell-list";
import { SpellDetail } from "~/components/spell/spell-detail";
import { CharacterFilter } from "~/components/filters/character-filter";
import { Button } from "~/components/ui/button";
import { BookOpen, Star } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);

  const url = new URL(request.url);
  const characterId = url.searchParams.get("character");

  // Get user's characters
  const characters = await getCharactersByUserId(user.id);

  // Get selected character or default to first one
  let selectedCharacter: CharacterWithDetails | null = null;
  let preparedSpells: SpellWithClasses[] = [];

  if (characterId) {
    selectedCharacter = await getCharacterById(Number(characterId), user.id);
  } else if (characters.length > 0) {
    selectedCharacter = characters[0];
  }

  if (selectedCharacter) {
    preparedSpells = await getPreparedSpellsByCharacter(selectedCharacter.id);
  }

  return {
    characters,
    selectedCharacter,
    preparedSpells,
  };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sorts prepares - Grimoire D&D 5e" },
    { name: "description", content: "Vos sorts prepares pour D&D 5e" },
  ];
}

export default function PreparedSpells({ loaderData }: Route.ComponentProps) {
  const { characters, selectedCharacter, preparedSpells } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSpell, setSelectedSpell] = useState<SpellWithClasses | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCharacterChange = (characterId: number | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (characterId) {
      newParams.set("character", characterId.toString());
    } else {
      newParams.delete("character");
    }
    setSearchParams(newParams);
  };

  const handleSpellClick = (spell: SpellWithClasses) => {
    setSelectedSpell(spell);
    setDialogOpen(true);
  };

  // Get prepared spell IDs for the PrepareButton
  const preparedSpellIds = preparedSpells.map((s) => s.id);

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">
          <Star className="h-16 w-16 text-stone-600" />
        </div>
        <h3 className="text-xl font-semibold text-stone-300 mb-2">
          Aucun personnage
        </h3>
        <p className="text-stone-500 max-w-md mb-4">
          Creez un personnage pour pouvoir preparer des sorts.
        </p>
        <Link to="/characters">
          <Button>Creer un personnage</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with character selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-amber-100 flex items-center gap-2">
            <Star className="h-6 w-6 text-amber-400 fill-current" />
            Sorts prepares
          </h1>
          {selectedCharacter && (
            <p className="text-stone-400 mt-1">
              {selectedCharacter.name} - {selectedCharacter.class.nomAffich}{" "}
              niveau {selectedCharacter.level}
            </p>
          )}
        </div>
        <CharacterFilter
          characters={characters}
          selectedCharacterId={selectedCharacter?.id || null}
          onChange={handleCharacterChange}
          isLoggedIn={true}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-400">
          {preparedSpells.length} sort
          {preparedSpells.length !== 1 ? "s" : ""} prepare
          {preparedSpells.length !== 1 ? "s" : ""}
        </p>
        <Link to="/" className="text-sm text-amber-400 hover:text-amber-300">
          <Button variant="ghost" size="sm">
            <BookOpen className="h-4 w-4 mr-1" />
            Voir tous les sorts
          </Button>
        </Link>
      </div>

      {/* Spell list or empty state */}
      {preparedSpells.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">
            <Star className="h-16 w-16 text-stone-600" />
          </div>
          <h3 className="text-xl font-semibold text-stone-300 mb-2">
            Aucun sort prepare
          </h3>
          <p className="text-stone-500 max-w-md mb-4">
            Preparez des sorts depuis la liste des sorts pour les retrouver ici.
          </p>
          <Link to="/">
            <Button>
              <BookOpen className="h-4 w-4 mr-2" />
              Parcourir les sorts
            </Button>
          </Link>
        </div>
      ) : (
        <SpellList
          spells={preparedSpells}
          onSpellClick={handleSpellClick}
          characterId={selectedCharacter?.id}
          preparedSpellIds={preparedSpellIds}
        />
      )}

      <SpellDetail
        spell={selectedSpell}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        characterId={selectedCharacter?.id}
        isPrepared={
          selectedSpell ? preparedSpellIds.includes(selectedSpell.id) : false
        }
      />
    </div>
  );
}
