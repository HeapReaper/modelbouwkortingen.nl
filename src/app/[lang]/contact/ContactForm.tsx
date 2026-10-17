"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useActionState } from "react";
import { sendContact } from "@/app/[lang]/contact/actions";
import { type ContactState, SUBJECTS } from "@/app/[lang]/contact/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/client";

export function ContactForm() {
  const { lang, dict } = useI18n();
  const c = dict.contact;
  const [state, action, pending] = useActionState<ContactState, FormData>(
    sendContact,
    { ok: false },
  );

  if (state.ok) {
    return (
      <Alert className="border-savings/40 p-6">
        <CheckCircle2 className="text-savings" />
        <AlertTitle className="text-lg">{c.sentTitle}</AlertTitle>
        <AlertDescription className="text-base">
          {state.message}
        </AlertDescription>
      </Alert>
    );
  }

  const v = state.values ?? {};
  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="lang" value={lang} />
      {state.message ? (
        <Alert variant="destructive">
          <AlertDescription className="text-base">
            {state.message}
          </AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={Boolean(state.errors?.name)}>
            <FieldLabel htmlFor="name" className="text-base">
              {c.name}
            </FieldLabel>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              required
              defaultValue={v.name}
              aria-invalid={Boolean(state.errors?.name)}
              className="h-12 text-base"
            />
            <FieldError>{state.errors?.name}</FieldError>
          </Field>
          <Field data-invalid={Boolean(state.errors?.email)}>
            <FieldLabel htmlFor="email" className="text-base">
              {c.email}
            </FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={v.email}
              aria-invalid={Boolean(state.errors?.email)}
              className="h-12 text-base"
            />
            <FieldError>{state.errors?.email}</FieldError>
          </Field>
        </div>
        <Field data-invalid={Boolean(state.errors?.subject)}>
          <FieldLabel htmlFor="subject" className="text-base">
            {c.subject}
          </FieldLabel>
          <NativeSelect
            id="subject"
            name="subject"
            defaultValue={v.subject ?? SUBJECTS[0]}
            className="w-full [&_select]:h-12 [&_select]:text-base"
          >
            {SUBJECTS.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {c.subjects[s]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError>{state.errors?.subject}</FieldError>
        </Field>
        <Field data-invalid={Boolean(state.errors?.message)}>
          <FieldLabel htmlFor="message" className="text-base">
            {c.message}
          </FieldLabel>
          <Textarea
            id="message"
            name="message"
            rows={7}
            required
            defaultValue={v.message}
            aria-invalid={Boolean(state.errors?.message)}
            className="text-base"
          />
          <FieldError>{state.errors?.message}</FieldError>
        </Field>
        {/* Honeypot tegen spam, onzichtbaar voor mensen */}
        <div
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 overflow-hidden"
        >
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>
      </FieldGroup>
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-12 w-full text-base font-bold sm:w-fit sm:px-8"
      >
        <Send className="size-4" /> {pending ? c.sending : c.send}
      </Button>
    </form>
  );
}
