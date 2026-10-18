"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useTransition } from "react";
import {
  addPhoneNumber,
  addSocialLink,
  type ContactFormState,
  deletePhoneNumber,
  deleteSocialLink,
  togglePhoneNumber,
  toggleSocialLink,
} from "@/app/[lang]/admin/actions";
import { SocialIcon } from "@/components/core/SocialIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import {
  SOCIAL_NAMES,
  SOCIAL_PLATFORMS,
  type SocialPlatform,
} from "@/lib/social-platforms";

type Phone = { id: number; label: string; number: string; enabled: boolean };
type Social = {
  id: number;
  platform: SocialPlatform;
  url: string;
  enabled: boolean;
};

/** Telefoonnummers voor de rode balk bovenaan de site. */
export function PhoneNumbersAdmin({ phones }: { phones: Phone[] }) {
  const [state, action, pending] = useActionState<ContactFormState, FormData>(
    addPhoneNumber,
    {},
  );
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Staan in de rode balk bovenaan elke pagina. Alleen nummers die aanstaan
        zijn zichtbaar.
      </p>
      <ContactList
        empty="Nog geen nummers."
        items={phones.map((p) => ({
          id: p.id,
          enabled: p.enabled,
          content: (
            <>
              <span className="font-semibold tabular-nums">{p.number}</span>
              {p.label ? (
                <span className="text-muted-foreground">{p.label}</span>
              ) : null}
            </>
          ),
          label: p.number,
        }))}
        onToggle={togglePhoneNumber}
        onDelete={deletePhoneNumber}
      />
      <form
        key={state.ok}
        action={action}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <Input
          name="number"
          type="tel"
          required
          placeholder="+31 6 12345678"
          aria-label="Telefoonnummer"
          className="sm:max-w-48"
        />
        <Input
          name="label"
          placeholder="Omschrijving (optioneel)"
          aria-label="Omschrijving"
          maxLength={40}
        />
        <Button type="submit" disabled={pending}>
          Toevoegen
        </Button>
      </form>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </div>
  );
}

/** Social-mediapagina's voor de footer. */
export function SocialLinksAdmin({ socials }: { socials: Social[] }) {
  const [state, action, pending] = useActionState<ContactFormState, FormData>(
    addSocialLink,
    {},
  );
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Staan onderaan elke pagina, in de footer. Alleen links die aanstaan zijn
        zichtbaar.
      </p>
      <ContactList
        empty="Nog geen links."
        items={socials.map((s) => ({
          id: s.id,
          enabled: s.enabled,
          content: (
            <>
              <SocialIcon platform={s.platform} className="size-4 shrink-0" />
              <span className="font-semibold">{SOCIAL_NAMES[s.platform]}</span>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-muted-foreground hover:underline"
              >
                {s.url}
              </a>
            </>
          ),
          label: SOCIAL_NAMES[s.platform],
        }))}
        onToggle={toggleSocialLink}
        onDelete={deleteSocialLink}
      />
      <form
        key={state.ok}
        action={action}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <NativeSelect name="platform" aria-label="Platform" required>
          {SOCIAL_PLATFORMS.map((p) => (
            <NativeSelectOption key={p} value={p}>
              {SOCIAL_NAMES[p]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Input
          name="url"
          required
          placeholder="https://www.facebook.com/…"
          aria-label="Link"
        />
        <Button type="submit" disabled={pending}>
          Toevoegen
        </Button>
      </form>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </div>
  );
}

function ContactList({
  items,
  empty,
  onToggle,
  onDelete,
}: {
  items: {
    id: number;
    enabled: boolean;
    content: React.ReactNode;
    /** Voor schermlezers: "… tonen" / "… verwijderen". */
    label: string;
  }[];
  empty: string;
  onToggle: (id: number, enabled: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  if (items.length === 0)
    return (
      <p className="rounded-xl border border-dashed p-4 text-center text-muted-foreground">
        {empty}
      </p>
    );
  return (
    <ul className="divide-y rounded-xl border">
      {items.map((item) => (
        <ContactRow
          key={item.id}
          item={item}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

function ContactRow({
  item,
  onToggle,
  onDelete,
}: {
  item: {
    id: number;
    enabled: boolean;
    content: React.ReactNode;
    label: string;
  };
  onToggle: (id: number, enabled: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <Switch
        checked={item.enabled}
        disabled={pending}
        aria-label={`${item.label} tonen`}
        onCheckedChange={(v) => start(() => onToggle(item.id, v))}
      />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {item.content}
      </div>
      <Button
        size="icon"
        variant="ghost"
        disabled={pending}
        aria-label={`${item.label} verwijderen`}
        onClick={() => {
          if (confirm(`${item.label} verwijderen?`))
            start(() => onDelete(item.id));
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
