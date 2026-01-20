import { Link, Form } from "react-router";
import { BookOpen, User, LogOut, LogIn, Users } from "lucide-react";
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
  user?: UserType | null;
}

export function Header({ spellCount, user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-950/95 backdrop-blur supports-[backdrop-filter]:bg-stone-950/80">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-900/30 border border-amber-800/50 group-hover:bg-amber-900/50 transition-colors">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-amber-100 group-hover:text-amber-50 transition-colors">
                Grimoire D&D 5e
              </h1>
              {spellCount !== undefined && (
                <p className="text-xs text-stone-500 hidden xs:block">
                  {spellCount} sorts disponibles
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
      </div>
    </header>
  );
}
