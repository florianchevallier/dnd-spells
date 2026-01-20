import { redirect, data } from "react-router";
import { Form, useActionData, useNavigation, Link } from "react-router";
import type { Route } from "./+types/auth.login";
import {
  authenticateUser,
  createSession,
  createSessionCookie,
  getSessionIdFromRequest,
  validateSession,
} from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { LogIn } from "lucide-react";

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

  // Validate input
  if (!email || !password) {
    return data({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  // Authenticate user
  const user = await authenticateUser(email, password);
  if (!user) {
    return data({ error: "Email ou mot de passe incorrect" }, { status: 401 });
  }

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
    { title: "Connexion - Grimoire D&D 5e" },
    { name: "description", content: "Connectez-vous pour acceder a vos personnages" },
  ];
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md bg-stone-900/50 border-stone-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-amber-200">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous pour acceder a vos personnages
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
                placeholder="Votre mot de passe"
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <LogIn className="h-4 w-4 mr-2" />
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </Button>

            <p className="text-center text-sm text-stone-400">
              Pas encore de compte?{" "}
              <Link to="/auth/signup" className="text-amber-400 hover:text-amber-300 underline">
                Creer un compte
              </Link>
            </p>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
