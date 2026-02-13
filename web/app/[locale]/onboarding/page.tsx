"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { StatusBanner } from "@/components/ui/status-banner";
import { StepIndicator } from "@/components/ui/step-indicator";
import { SuggestedChips } from "@/components/ui/suggested-chips";
import { TextInput } from "@/components/ui/text-input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { mapAppErrorKey } from "@/lib/error-message";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const common = useTranslations("common");
  const et = useTranslations("errors");
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);
  const completeProfile = useMutation(api.users.completeProfile);
  const generateAvatarUploadUrl = useMutation(
    api.users.generateAvatarUploadUrl,
  );
  const setAvatarFromStorage = useMutation(api.users.setAvatarFromStorage);

  const [username, setUsername] = useState("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null,
  );
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const usernameSuggestions = [
    "ShadowWolf",
    "SilentViper",
    "NightOwl",
    "GhostKing",
    "CipherFox",
  ];

  useEffect(() => {
    if (currentUser?.hasCompletedProfile) {
      router.replace("/game");
    }
  }, [currentUser, router]);

  async function submitProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await completeProfile({ username });

      if (selectedAvatarFile) {
        const uploadUrl = await generateAvatarUploadUrl();
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedAvatarFile.type },
          body: selectedAvatarFile,
        });

        if (!uploadResponse.ok) {
          throw new Error(t("avatarUploadFailed"));
        }

        const uploadResult = (await uploadResponse.json()) as {
          storageId: string;
        };

        await setAvatarFromStorage({
          storageId: uploadResult.storageId as Id<"_storage">,
        });
      }

      router.replace("/game");
    } catch (error) {
      setErrorMessage(et(mapAppErrorKey(error)));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-sm items-center justify-center overflow-hidden px-6 py-8">
      <div className="pointer-events-none absolute -top-24 -end-20 h-72 w-72 rounded-full bg-primary/25 blur-3xl animate-pulse-slow" />
      <div className="pointer-events-none absolute -bottom-24 -start-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-pulse-slow" />
      <div className="pointer-events-none absolute inset-0 bg-scanlines opacity-25" />

      <section className="relative z-10 w-full rounded-2xl border border-white/10 bg-surface/70 p-6 backdrop-blur-md">
        <div className="mb-5 flex items-center justify-between gap-3">
          <StepIndicator currentStep={step} totalSteps={3} className="flex-1" />
          <LanguageSwitcher variant="icon" />
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <h1 className="text-xl font-bold tracking-tight text-white">
              {t("title")}
            </h1>
            <p className="text-sm text-text-tertiary">{t("description")}</p>

            <TextInput
              type="text"
              required
              minLength={3}
              maxLength={24}
              label={t("username")}
              icon="alternate_email"
              placeholder={t("username")}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              showCounter
              helperText={common("you")}
            />

            <SuggestedChips
              suggestions={usernameSuggestions}
              onSelect={(value) => setUsername(value)}
            />

            <PrimaryButton
              type="button"
              icon="arrow_forward"
              disabled={username.trim().length < 3}
              onClick={() => setStep(2)}
            >
              {t("saveProfile")}
            </PrimaryButton>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={submitProfile}>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {t("title")}
            </h1>
            <p className="text-sm text-text-tertiary">{t("description")}</p>

            <div className="flex items-center gap-4">
              <AvatarCircle
                username={username || currentUser?.name || undefined}
                size={72}
                editable
                glowWrapper
              />
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setSelectedAvatarFile(event.target.files?.[0] ?? null)
                }
                className="block w-full text-xs text-text-tertiary file:me-3 file:rounded-lg file:border file:border-white/15 file:bg-white/5 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-text-secondary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SecondaryButton
                type="button"
                variant="outline"
                icon="arrow_back"
                onClick={() => setStep(1)}
              >
                {common("back")}
              </SecondaryButton>
              <PrimaryButton
                disabled={submitting}
                loading={submitting}
                icon="check"
                type="submit"
              >
                {submitting ? t("saving") : t("saveProfile")}
              </PrimaryButton>
            </div>
          </form>
        )}

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
