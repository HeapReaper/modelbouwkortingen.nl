"use client";

import { CheckCircle2, LogOut, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { useActionState, useId, useTransition } from "react";
import {
  cancelOwnAlert,
  changeAccountEmail,
  changeAccountPassword,
  deleteOwnAccount,
  loginAccount,
  logoutAccount,
  registerAccount,
  requestReset,
  resetAccountPassword,
  setAccountNewsletter,
  updateAccountAlert,
} from "@/app/[lang]/account/actions";
import type { NewsletterState } from "@/app/[lang]/nieuwsbrief/shared";
import { ProductImage } from "@/components/deals/ProductImage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/i18n/client";
import { t } from "@/i18n/translate";
import type { AccountAlert } from "@/lib/account";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-shared";
import { getShop } from "@/lib/shops";
import { cn } from "@/lib/utils";

type Action = (
  prev: NewsletterState,
  formData: FormData,
) => Promise<NewsletterState>;

function Message({ state }: { state: NewsletterState }) {
  if (!state.message) return null;
  return (
    <Alert variant={state.ok ? "default" : "destructive"} className="p-4">
      {state.ok ? <CheckCircle2 className="text-savings" /> : <XCircle />}
      <AlertDescription className="text-base">{state.message}</AlertDescription>
    </Alert>
  );
}

function Field({
  label,
  hint,
  ...input
}: React.ComponentProps<typeof Input> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <Input
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="h-11 bg-background text-base"
        {...input}
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Formulier met taalveld, foutmelding en verzendknop; verdwijnt na succes als `hideOnOk`. */
function AccountForm({
  action,
  submit,
  pendingLabel,
  hideOnOk,
  variant,
  children,
}: {
  action: Action;
  submit: string;
  pendingLabel: string;
  hideOnOk?: boolean;
  variant?: "default" | "destructive";
  children: (state: NewsletterState) => React.ReactNode;
}) {
  const { lang } = useI18n();
  const [state, formAction, pending] = useActionState(action, { ok: false });
  if (hideOnOk && state.ok) return <Message state={state} />;
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="lang" value={lang} />
      {children(state)}
      <Button
        type="submit"
        size="lg"
        variant={variant}
        disabled={pending}
        className="h-11 w-fit px-6 text-base font-bold"
      >
        {pending ? pendingLabel : submit}
      </Button>
      <Message state={state} />
    </form>
  );
}

export function LoginForm() {
  const { dict, href } = useI18n();
  const a = dict.account;
  return (
    <div className="flex flex-col gap-4">
      <AccountForm
        action={loginAccount}
        submit={a.login}
        pendingLabel={a.loggingIn}
      >
        {(state) => (
          <>
            <Field
              label={a.email}
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={state.email}
            />
            <Field
              label={a.password}
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </>
        )}
      </AccountForm>
      <p className="text-sm">
        <Link
          href={href("/account/wachtwoord-vergeten")}
          className="font-semibold text-primary hover:underline"
        >
          {a.forgotLink}
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const { dict } = useI18n();
  const a = dict.account;
  return (
    <AccountForm
      action={registerAccount}
      submit={a.register}
      pendingLabel={a.registering}
      hideOnOk
    >
      {(state) => (
        <>
          <Field
            label={a.email}
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state.email}
          />
          <Field
            label={a.password}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            hint={t(a.passwordHint, { min: MIN_PASSWORD_LENGTH })}
          />
          <Field
            label={a.password2}
            name="password2"
            type="password"
            autoComplete="new-password"
            required
          />
          <p className="text-sm text-muted-foreground">{a.registerPrivacy}</p>
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
        </>
      )}
    </AccountForm>
  );
}

export function ForgotPasswordForm() {
  const { dict } = useI18n();
  const a = dict.account;
  return (
    <AccountForm
      action={requestReset}
      submit={a.forgotSubmit}
      pendingLabel={a.sending}
      hideOnOk
    >
      {(state) => (
        <Field
          label={a.email}
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
        />
      )}
    </AccountForm>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const { dict } = useI18n();
  const a = dict.account;
  return (
    <AccountForm
      action={resetAccountPassword}
      submit={a.resetSubmit}
      pendingLabel={a.saving}
    >
      {() => (
        <>
          <input type="hidden" name="token" value={token} />
          <NewPasswordFields />
        </>
      )}
    </AccountForm>
  );
}

function NewPasswordFields() {
  const { dict } = useI18n();
  const a = dict.account;
  return (
    <>
      <Field
        label={a.newPassword}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        hint={t(a.passwordHint, { min: MIN_PASSWORD_LENGTH })}
      />
      <Field
        label={a.password2}
        name="password2"
        type="password"
        autoComplete="new-password"
        required
      />
    </>
  );
}

export function ChangePasswordForm() {
  const { dict } = useI18n();
  const a = dict.account;
  return (
    <AccountForm
      action={changeAccountPassword}
      submit={a.changePassword}
      pendingLabel={a.saving}
    >
      {() => (
        <>
          <Field
            label={a.currentPassword}
            name="current"
            type="password"
            autoComplete="current-password"
            required
          />
          <NewPasswordFields />
        </>
      )}
    </AccountForm>
  );
}

export function ChangeEmailForm() {
  const { dict } = useI18n();
  const a = dict.account;
  return (
    <AccountForm
      action={changeAccountEmail}
      submit={a.emailSubmit}
      pendingLabel={a.sending}
    >
      {(state) => (
        <>
          <Field
            label={a.newEmail}
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state.ok ? undefined : state.email}
          />
          <Field
            label={a.currentPassword}
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </>
      )}
    </AccountForm>
  );
}

export function DeleteAccountForm() {
  const { dict } = useI18n();
  const a = dict.account;
  return (
    <AccountForm
      action={deleteOwnAccount}
      submit={a.deleteSubmit}
      pendingLabel={a.deleting}
      variant="destructive"
    >
      {() => (
        <Field
          label={a.deleteConfirmPassword}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      )}
    </AccountForm>
  );
}

export function LogoutButton() {
  const { lang, dict } = useI18n();
  return (
    <form action={logoutAccount}>
      <input type="hidden" name="lang" value={lang} />
      <Button
        type="submit"
        variant="outline"
        size="lg"
        className="h-11 font-bold"
      >
        <LogOut className="size-4" />
        {dict.account.logout}
      </Button>
    </form>
  );
}

export function NewsletterSwitch({ subscribed }: { subscribed: boolean }) {
  const id = useId();
  const { lang, dict } = useI18n();
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3">
      <Switch
        id={id}
        checked={subscribed}
        disabled={pending}
        onCheckedChange={(v) => start(() => setAccountNewsletter(v, lang))}
      />
      <label htmlFor={id} className="text-base font-semibold">
        {dict.account.newsletterSwitch}
      </label>
    </div>
  );
}

export function AlertList({ alerts }: { alerts: AccountAlert[] }) {
  const { dict } = useI18n();
  const a = dict.account;
  if (alerts.length === 0)
    return (
      <p className="rounded-xl border border-dashed p-4 text-center text-muted-foreground">
        {a.alertsEmpty}
      </p>
    );
  return (
    <ul className="divide-y rounded-xl border">
      {alerts.map((alert) => (
        <AlertRow key={alert.id} alert={alert} />
      ))}
    </ul>
  );
}

function AlertRow({ alert }: { alert: AccountAlert }) {
  const id = useId();
  const { lang, dict, href, fmt } = useI18n();
  const a = dict.account;
  const [state, formAction, saving] = useActionState(updateAccountAlert, {
    ok: false,
  });
  const [cancelling, start] = useTransition();
  const open = alert.status === "active" || alert.status === "pending";
  const status = {
    active: a.alertActive,
    pending: a.alertPending,
    triggered: t(a.alertTriggered, {
      price: fmt.euro(alert.triggeredPrice ?? alert.targetPrice),
      date: alert.triggeredAt ? fmt.shortDate(new Date(alert.triggeredAt)) : "",
    }),
    cancelled: a.alertCancelled,
  }[alert.status];
  return (
    <li
      className={cn(
        "flex flex-col gap-3 p-3 sm:flex-row sm:items-center",
        !open && "opacity-70",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ProductImage
          src={alert.imageUrl}
          alt=""
          categorySlug={alert.categorySlug}
          className="size-16 shrink-0 rounded-lg p-1"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            href={href(`/product/${alert.productId}`)}
            className="line-clamp-2 font-semibold hover:underline"
          >
            {alert.name}
          </Link>
          <span className="text-sm text-muted-foreground">
            {getShop(alert.shopSlug)?.name ?? alert.shopSlug} ·{" "}
            {t(a.alertNow, { price: fmt.euro(alert.price) })}
          </span>
          <span className="text-sm font-semibold">{status}</span>
        </div>
      </div>
      {open ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-end gap-2">
            <form action={formAction} className="flex items-end gap-2">
              <input type="hidden" name="lang" value={lang} />
              <input type="hidden" name="alert" value={alert.id} />
              <div className="flex flex-col gap-1">
                <label htmlFor={id} className="text-sm font-semibold">
                  {a.alertTarget}
                </label>
                <Input
                  id={id}
                  name="target"
                  inputMode="decimal"
                  defaultValue={alert.targetPrice}
                  className="h-9 w-24 bg-background tabular-nums"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={saving}
              >
                {a.save}
              </Button>
            </form>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={cancelling}
              aria-label={t(a.alertCancel, { name: alert.name })}
              title={t(a.alertCancel, { name: alert.name })}
              onClick={() => start(() => cancelOwnAlert(alert.id))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          {state.message ? (
            <p
              className={cn(
                "text-sm font-semibold",
                state.ok ? "text-savings" : "text-destructive",
              )}
            >
              {state.message}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
