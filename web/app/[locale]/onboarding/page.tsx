"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
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
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (currentUser?.hasCompletedProfile) {
    router.replace("/game");
  }

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
      const message =
        error instanceof Error ? error.message : t("profileSetupFailed");
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <section className="w-full space-y-4 rounded-xl border p-6">
        <div className="w-full flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-zinc-500">{t("description")}</p>

        <div className="flex items-center gap-3">
          <UserAvatar
            username={username || currentUser?.name || undefined}
            size={48}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              setSelectedAvatarFile(event.target.files?.[0] ?? null)
            }
          />
        </div>

        <form className="space-y-3" onSubmit={submitProfile}>
          <input
            type="text"
            required
            minLength={3}
            maxLength={24}
            placeholder={t("username")}
            className="w-full rounded-md border px-3 py-2"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <Button disabled={submitting} className="w-full" type="submit">
            {submitting ? t("saving") : t("saveProfile")}
          </Button>
        </form>

        {errorMessage ? (
          <p className="text-sm text-red-600">{errorMessage}</p>
        ) : null}
      </section>
    </main>
  );
}
