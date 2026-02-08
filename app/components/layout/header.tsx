import { Link, Form, NavLink } from "react-router";
import { BookOpen, User, LogOut, LogIn, Users, Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { User as UserType } from "~/db/schema.server";

interface HeaderProps {
  spellCount?: number;
  monsterCount?: number;
  user?: UserType | null;
}

export function Header({ spellCount, monsterCount, user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-950/95 backdrop-blur supports-[backdrop-filter]:bg-stone-950/80">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-col gap-3 sm:gap-2">
          <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-900/30 border border-amber-800/50 group-hover:bg-amber-900/50 transition-colors">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-amber-100 group-hover:text-amber-50 transition-colors">
                Grimoire D&D 5e
              </h1>
              {(spellCount !== undefined || monsterCount !== undefined) && (
                <p className="text-xs text-stone-500 hidden xs:block">
                  {spellCount ?? 0} sorts • {monsterCount ?? 0} monstres
                </p>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {user.displayName || user.email.split("@")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/spells/prepared" className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Sorts prepares
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/monsters/favorites" className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Monstres favoris
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/characters" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Mes personnages
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Form method="post" action="/auth/logout" className="w-full">
                      <button
                        type="submit"
                        className="flex items-center gap-2 w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Deconnexion
                      </button>
                    </Form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth/login">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Connexion</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                  isActive
                    ? "bg-amber-900/40 text-amber-200 border border-amber-800/60"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
                }`
              }
            >
              Sorts
            </NavLink>
            <NavLink
              to="/monsters"
              className={({ isActive }) =>
                `px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                  isActive
                    ? "bg-amber-900/40 text-amber-200 border border-amber-800/60"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
                }`
              }
            >
              Monstres
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}
