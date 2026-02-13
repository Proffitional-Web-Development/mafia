"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useTranslations } from "next-intl";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";

type AuthMode = "signIn" | "signUp";

export default function AuthPage() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const router = useRouter();
  const { signIn } = useAuthActions();
  const currentUser = useQuery(api.users.getCurrentUser);

  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (currentUser) {
    router.replace(currentUser.hasCompletedProfile ? "/game" : "/onboarding");
  }

  async function submitEmailPasswordAuth(
    event: React.FormEvent<HTMLFormElement>
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
      const message =
        error instanceof Error ? error.message : t("authenticationFailed");
      setErrorMessage(message);
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
      const message =
        error instanceof Error ? error.message : t("googleSignInFailed");
      setErrorMessage(message);
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <section className="w-full space-y-4 rounded-xl border p-6">
        <div className="w-full flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="text-xl font-semibold">
          {mode === "signIn" ? t("signIn") : t("createAccount")}
        </h1>
        <p className="text-sm text-zinc-500">{t("noGuestAccess")}</p>

        <form className="space-y-3" onSubmit={submitEmailPasswordAuth}>
          <input
            type="email"
            required
            placeholder={t("email")}
            className="w-full rounded-md border px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder={t("password")}
            className="w-full rounded-md border px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button disabled={loading} className="w-full" type="submit">
            {loading
              ? common("pleaseWait")
              : mode === "signIn"
                ? t("signIn")
                : t("createAccount")}
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loading}
          onClick={continueWithGoogle}
        >
          {t("continueWithGoogle")}
        </Button>

        <button
          type="button"
          className="text-sm text-zinc-600 underline"
          onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
        >
          {mode === "signIn" ? t("needAccount") : t("haveAccount")}
        </button>

        {errorMessage ? (
          <p className="text-sm text-red-600">{errorMessage}</p>
        ) : null}
      </section>
    </main>
  );
}
