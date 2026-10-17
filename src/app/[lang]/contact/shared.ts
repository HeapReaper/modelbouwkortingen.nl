export type ContactState = {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<"name" | "email" | "subject" | "message", string>>;
  values?: Record<string, string>;
};

/** Onderwerpen; de labels staan per taal in dict.contact.subjects. */
export const SUBJECTS = [
  "general",
  "price",
  "addShop",
  "owner",
  "collaboration",
  "other",
] as const;
export type Subject = (typeof SUBJECTS)[number];
