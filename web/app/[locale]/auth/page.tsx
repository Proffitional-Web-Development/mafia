"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Divider } from "@/components/ui/divider";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { StatusBanner } from "@/components/ui/status-banner";
import { TextInput } from "@/components/ui/text-input";
import { useRouter } from "@/i18n/navigation";
import { mapAppErrorKey } from "@/lib/error-message";

type AuthMode = "signIn" | "signUp";

export default function AuthPage() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const et = useTranslations("errors");
  const router = useRouter();
  const { signIn } = useAuthActions();

  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submitEmailPasswordAuth(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      await signIn("password", {
        email,
        password,
        flow: mode,
      });
      router.replace("/onboarding");
    } catch (error) {
      setErrorMessage(et(mapAppErrorKey(error)));
    } finally {
      setLoading(false);
    }
  }

  async function continueWithGoogle() {
    setLoading(true);
    setErrorMessage(null);

    try {
      await signIn("google", {
        redirectTo: "/onboarding",
      });
    } catch (error) {
      setErrorMessage(et(mapAppErrorKey(error)));
      setLoading(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-sm items-center justify-center overflow-hidden px-6 py-8 md:max-w-3xl md:px-8 lg:max-w-5xl lg:px-10">
      <div className="pointer-events-none absolute -top-24 -end-20 h-72 w-72 rounded-full bg-primary/25 blur-3xl animate-pulse-slow" />
      <div className="pointer-events-none absolute -bottom-24 -start-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-pulse-slow" />
      <div className="pointer-events-none absolute inset-0 bg-scanlines opacity-25" />

      <section className="relative z-10 w-full rounded-2xl border border-white/10 bg-surface/70 p-6 backdrop-blur-md md:max-w-xl md:p-7 lg:max-w-2xl lg:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-white">
            {mode === "signIn" ? t("signIn") : t("createAccount")}
          </h1>
          <LanguageSwitcher variant="pill" />
        </div>
        <p className="mb-5 text-sm text-text-tertiary">{t("noGuestAccess")}</p>

        <form className="space-y-4" onSubmit={submitEmailPasswordAuth}>
          <TextInput
            type="email"
            required
            icon="alternate_email"
            label={t("email")}
            placeholder={t("email")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextInput
            type="password"
            required
            minLength={8}
            icon="vpn_key"
            label={t("password")}
            placeholder={t("password")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <PrimaryButton
            disabled={loading}
            loading={loading}
            icon="login"
            type="submit"
          >
            {loading
              ? common("pleaseWait")
              : mode === "signIn"
                ? t("signIn")
                : t("createAccount")}
          </PrimaryButton>
        </form>

        <Divider className="my-4" label={common("or")} variant="gradient" />

        <SecondaryButton
          type="button"
          variant="oauth"
          disabled={loading}
          onClick={continueWithGoogle}
          icon="g_mobiledata"
        >
          {t("continueWithGoogle")}
        </SecondaryButton>

        <SecondaryButton
          type="button"
          variant="text-link"
          fullWidth={false}
          className="mt-4"
          onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
        >
          {mode === "signIn" ? t("needAccount") : t("haveAccount")}
        </SecondaryButton>

        {errorMessage ? (
          <StatusBanner
            message={errorMessage}
            variant="error"
            className="mt-3"
          />
        ) : null}
      </section>
    </main>
  );
}
