import { redirect } from "react-router";
import {
  getSessionIdFromRequest,
  validateSession,
} from "~/lib/auth.server";
import type { User } from "~/db/schema";

// Protect a route - redirects to login if not authenticated
export async function requireAuth(request: Request): Promise<User> {
  const sessionId = getSessionIdFromRequest(request);

  if (!sessionId) {
    throw redirect("/auth/login");
  }

  const user = await validateSession(sessionId);

  if (!user) {
    throw redirect("/auth/login");
  }

  return user;
}

// Get current user if authenticated, or null if not
export async function getOptionalUser(request: Request): Promise<User | null> {
  const sessionId = getSessionIdFromRequest(request);

  if (!sessionId) {
    return null;
  }

  return validateSession(sessionId);
}
