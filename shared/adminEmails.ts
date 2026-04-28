export const ADMIN_EMAILS: readonly string[] = ["joachim@0001.dev"];

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return ADMIN_EMAILS.includes(normalizeEmail(email));
}
