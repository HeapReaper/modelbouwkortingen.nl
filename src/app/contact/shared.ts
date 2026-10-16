export type ContactState = {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<"name" | "email" | "subject" | "message", string>>;
  values?: Record<string, string>;
};

export const SUBJECTS = [
  "Algemene vraag",
  "Deal of prijs klopt niet",
  "Webshop toevoegen",
  "Ik ben webshop-eigenaar",
  "Samenwerking",
  "Anders",
] as const;
