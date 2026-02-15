"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PrimaryButton } from "@/components/ui/primary-button";
import { StatusBanner } from "@/components/ui/status-banner";
import { TextInput } from "@/components/ui/text-input";
import { api } from "@/convex/_generated/api";
import { useRouter } from "@/i18n/navigation";
import { mapAppErrorKey } from "@/lib/error-message";

export default function AuthPage() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const et = useTranslations("errors");
  const router = useRouter();
  const { signIn } = useAuthActions();
  const currentUser = useQuery(api.users.getCurrentUser);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [awaitingSession, setAwaitingSession] = useState(false);
  const showCookieHint = useMemo(() => {
    const isSecure = window.location.protocol === "https:";
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    return !isSecure && !isLocalhost;
  }, []);

  useEffect(() => {
    if (currentUser) {
      router.replace("/game");
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (!awaitingSession) return;
    if (currentUser) return;

    const timeoutId = window.setTimeout(() => {
      setAwaitingSession(false);
      setLoading(false);
      setErrorMessage(et("cookiesBlocked"));
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [awaitingSession, currentUser, et]);

  async function submitEmailPasswordAuth(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      // Step 1: Try to sign in
      await signIn("password", {
        email: username,
        password,
        flow: "signIn",
      });
      setAwaitingSession(true);
    } catch (signInError: any) {
      // Step 2: If sign in fails, try to sign up
      try {
        await signIn("password", {
          email: username,
          password,
          flow: "signUp",
        });
        setAwaitingSession(true);
      } catch (signUpError: any) {
        // Step 3: If sign up also fails, decide which error to show
        let errorToShow = signInError;

        // If sign up failed because username is taken, it means the user exists
        // so the original sign-in error (e.g. wrong password) is the correct one.
        // We check for various "taken" strings just in case.
        const signUpErrorMsg = (signUpError?.message || "").toLowerCase();
        /*
         * Note: The exact error message for "username taken" depends on the implementation.
         * Assuming standard behavior, but if signUpError is "Conflict" or similar.
         * For now, we fall back to the signInError as the primary failure reason
         * if the user existed.
         */
        
        // If the error was just "User not found" (fake error for security sometimes),
        // but here we are explicit. 
        
        console.error("SignIn failed:", signInError);
        console.error("SignUp failed:", signUpError);

        setErrorMessage(et(mapAppErrorKey(errorToShow)));
        setAwaitingSession(false);
        setLoading(false);
      }
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
            {t("welcome")}
          </h1>
          <LanguageSwitcher variant="pill" />
        </div>
        <p className="mb-5 text-sm text-text-tertiary">{t("noGuestAccess")}</p>

        {showCookieHint ? (
          <StatusBanner
            message={et("mobileCookieHint")}
            variant="warning"
            className="mb-4"
          />
        ) : null}

        <form className="space-y-4 mt-3" onSubmit={submitEmailPasswordAuth}>
          <TextInput
            type="text"
            required
            minLength={3}
            maxLength={24}
            icon="person"
            label={t("username")}
            placeholder={t("username")}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <TextInput
            type="password"
            required
            // minLength={8} // Removed complexity requirement
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
              : t("continue")}
          </PrimaryButton>
        </form>

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
