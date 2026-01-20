import { redirect, data } from "react-router";
import { Form, useActionData, useNavigation, Link } from "react-router";
import type { Route } from "./+types/auth.signup";
import {
  createUser,
  isEmailTaken,
  createSession,
  createSessionCookie,
  getSessionIdFromRequest,
  validateSession,
} from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { UserPlus } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  // If already logged in, redirect to spells page
  const sessionId = getSessionIdFromRequest(request);
  if (sessionId) {
    const user = await validateSession(sessionId);
    if (user) {
      return redirect("/");
    }
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const displayName = formData.get("displayName") as string;

  // Validate input
  if (!email || !password) {
    return data({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return data({ error: "Format d'email invalide" }, { status: 400 });
  }

  // Validate password length
  if (password.length < 6) {
    return data({ error: "Le mot de passe doit contenir au moins 6 caracteres" }, { status: 400 });
  }

  // Validate password confirmation
  if (password !== confirmPassword) {
    return data({ error: "Les mots de passe ne correspondent pas" }, { status: 400 });
  }

  // Check if email is already taken
  const emailExists = await isEmailTaken(email);
  if (emailExists) {
    return data({ error: "Cet email est deja utilise" }, { status: 400 });
  }

  // Create user
  const user = await createUser(email, password, displayName);

  // Create session
  const sessionId = await createSession(user.id);
  const isProduction = process.env.NODE_ENV === "production";
  const sessionCookie = createSessionCookie(sessionId, isProduction);

  // Redirect to spells page with session cookie
  return redirect("/", {
    headers: {
      "Set-Cookie": sessionCookie,
    },
  });
}

export function meta() {
  return [
    { title: "Inscription - Grimoire D&D 5e" },
    { name: "description", content: "Creez un compte pour gerer vos personnages D&D" },
  ];
}

export default function SignupPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md bg-stone-900/50 border-stone-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-amber-200">Creer un compte</CardTitle>
          <CardDescription>
            Inscrivez-vous pour creer et gerer vos personnages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            {actionData?.error && (
              <div className="bg-red-900/20 border border-red-800 rounded-md p-3">
                <p className="text-red-400 text-sm">{actionData.error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium text-stone-300">
                Nom d'affichage (optionnel)
              </label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="Votre pseudo"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-stone-300">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="votre@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-stone-300">
                Mot de passe
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 6 caracteres"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-stone-300">
                Confirmer le mot de passe
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirmez votre mot de passe"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <UserPlus className="h-4 w-4 mr-2" />
              {isSubmitting ? "Creation..." : "Creer mon compte"}
            </Button>

            <p className="text-center text-sm text-stone-400">
              Deja un compte?{" "}
              <Link to="/auth/login" className="text-amber-400 hover:text-amber-300 underline">
                Se connecter
              </Link>
            </p>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
