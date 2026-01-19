export const SCHOOLS = {
  Abjuration: { color: "bg-blue-950/50 border-blue-800/50 text-blue-400", textColor: "text-blue-400" },
  Divination: { color: "bg-purple-950/50 border-purple-800/50 text-purple-400", textColor: "text-purple-400" },
  Enchantement: { color: "bg-pink-950/50 border-pink-800/50 text-pink-400", textColor: "text-pink-400" },
  Évocation: { color: "bg-red-950/50 border-red-800/50 text-red-400", textColor: "text-red-400" },
  Illusion: { color: "bg-violet-950/50 border-violet-800/50 text-violet-400", textColor: "text-violet-400" },
  Invocation: { color: "bg-amber-950/50 border-amber-800/50 text-amber-400", textColor: "text-amber-400" },
  Nécromancie: { color: "bg-emerald-950/50 border-emerald-800/50 text-emerald-400", textColor: "text-emerald-400" },
  Transmutation: { color: "bg-orange-950/50 border-orange-800/50 text-orange-400", textColor: "text-orange-400" },
} as const;

export const LEVELS = [
  { value: 0, label: "Tour de magie" },
  { value: 1, label: "Niveau 1" },
  { value: 2, label: "Niveau 2" },
  { value: 3, label: "Niveau 3" },
  { value: 4, label: "Niveau 4" },
  { value: 5, label: "Niveau 5" },
  { value: 6, label: "Niveau 6" },
  { value: 7, label: "Niveau 7" },
  { value: 8, label: "Niveau 8" },
  { value: 9, label: "Niveau 9" },
] as const;

export const CLASSES = [
  { id: "barde", name: "Barde" },
  { id: "clerc", name: "Clerc" },
  { id: "druide", name: "Druide" },
  { id: "ensorceleur", name: "Ensorceleur" },
  { id: "magicien", name: "Magicien" },
  { id: "occultiste", name: "Occultiste" },
  { id: "paladin", name: "Paladin" },
  { id: "rodeur", name: "Rôdeur" },
] as const;

export function getSchoolColor(school: string): string {
  const normalizedSchool = school.charAt(0).toUpperCase() + school.slice(1).toLowerCase();
  return SCHOOLS[normalizedSchool as keyof typeof SCHOOLS]?.color || "bg-gray-600";
}

export function getSchoolTextColor(school: string): string {
  const normalizedSchool = school.charAt(0).toUpperCase() + school.slice(1).toLowerCase();
  return SCHOOLS[normalizedSchool as keyof typeof SCHOOLS]?.textColor || "text-gray-400";
}

export function getLevelLabel(level: number): string {
  return level === 0 ? "Tour de magie" : `Niveau ${level}`;
}
