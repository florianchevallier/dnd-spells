import { redirect } from "react-router";
import type { Route } from "./+types/auth.logout";
import {
  getSessionIdFromRequest,
  destroySession,
  createLogoutCookie,
} from "~/lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  const sessionId = getSessionIdFromRequest(request);

  if (sessionId) {
    await destroySession(sessionId);
  }

  return redirect("/", {
    headers: {
      "Set-Cookie": createLogoutCookie(),
    },
  });
}

export async function loader() {
  // Redirect GET requests to homepage
  return redirect("/");
}
