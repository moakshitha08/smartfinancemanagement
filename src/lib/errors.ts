// Maps backend errors to safe, user-friendly messages.
// Raw errors (which may include table names, constraint names, RLS hints, etc.)
// are logged to the console for developers but never shown to end users.

type AnyErr = { message?: string; code?: string; status?: number; name?: string } | null | undefined;

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid username or password.",
  invalid_grant: "Invalid username or password.",
  user_already_exists: "An account with this username already exists.",
  email_address_invalid: "Please enter a valid username.",
  weak_password: "Password is too weak. Please choose a stronger one.",
  over_email_send_rate_limit: "Too many attempts. Please try again shortly.",
  same_password: "New password must be different from the current one.",
};

const PG_MESSAGES: Record<string, string> = {
  "23505": "This entry already exists.",
  "23502": "Please fill in all required fields.",
  "23514": "One of the values is not allowed.",
  "23503": "Related record was not found.",
  "22P02": "One of the values has the wrong format.",
  "42501": "You do not have permission to perform this action.",
  PGRST301: "You do not have permission to perform this action.",
};

export function toUserMessage(err: AnyErr, fallback = "Something went wrong. Please try again."): string {
  if (!err) return fallback;
  // Log raw error for developers — never shown to users.
  // eslint-disable-next-line no-console
  console.error("[app-error]", err);

  const code = (err as any).code as string | undefined;
  if (code && PG_MESSAGES[code]) return PG_MESSAGES[code];
  if (code && AUTH_MESSAGES[code]) return AUTH_MESSAGES[code];

  const status = (err as any).status as number | undefined;
  if (status === 401 || status === 403) return "You do not have permission to perform this action.";
  if (status === 429) return "Too many requests. Please try again shortly.";
  if (status && status >= 500) return "Service temporarily unavailable. Please try again.";

  return fallback;
}