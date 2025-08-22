import type { AuthUser } from "./types";

export const MOCHA_SESSION_TOKEN_COOKIE_NAME = "mocha_session_token";

type Options = { apiUrl: string; apiKey: string };

export async function getOAuthRedirectUrl(
  _provider: string,
  _opts: Options
): Promise<string> {
  // Stub: return local login path
  return "/login";
}

export async function exchangeCodeForSessionToken(
  _code: string,
  _opts: Options
): Promise<string> {
  // Stub: return a static dev token
  return "dev-session";
}

export async function deleteSession(
  _token: string,
  _opts: Options
): Promise<void> {
  // Stub: no-op
  return;
}

export async function getCurrentUser(
  sessionToken: string,
  _opts: Options
): Promise<AuthUser | null> {
  if (sessionToken === "dev-session") {
    return {
      id: "dev-user",
      email: "dev@example.com",
      google_user_data: {
        given_name: "Dev",
        family_name: "User",
        email: "dev@example.com",
      },
    };
  }
  return null;
}
