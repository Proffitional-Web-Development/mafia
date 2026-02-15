"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { Icon } from "@/components/ui/icon";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TextInput } from "@/components/ui/text-input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ThemeColorPicker } from "./theme-color-picker";

export function SettingsPageContent() {
  const t = useTranslations("settings");
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const authMethod = useQuery(api.users.getAuthMethod);

  const updateDisplayName = useMutation(api.users.updateDisplayName);
  const toggleMusic = useMutation(api.users.toggleMusic);
  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const setAvatar = useMutation(api.users.setAvatarFromStorage);

  const [displayName, setDisplayName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? "");
    }
  }, [user]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) return;

    setIsSavingProfile(true);
    try {
      await updateDisplayName({ displayName: displayName.trim() });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error(error);
      alert("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(t("profile.maxSize"));
      return;
    }

    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();
      await setAvatar({ storageId: storageId as Id<"_storage"> });
    } catch (error) {
      console.error(error);
      alert("Avatar upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleMusic = async (enabled: boolean) => {
    try {
      await toggleMusic({ enabled });
    } catch {
      console.error("Failed to toggle music");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      alert(t("security.passwordHelp"));
      return;
    }

    setIsChangingPassword(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Password change functionality is not fully implemented yet.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      alert("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Icon name="refresh" className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-8 pb-32">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full p-2 text-text-secondary hover:bg-white/10"
        >
          <Icon name="arrow_back" />
        </button>
        <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
      </div>

      {/* Profile Section */}
      <section className="space-y-6 rounded-2xl border border-white/10 bg-surface/40 p-6">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {t("profile.title")}
          </h2>
          <p className="text-sm text-text-tertiary">
            Manage your public profile
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <AvatarCircle
              avatarUrl={user.avatarUrl}
              username={user.displayName ?? user.username ?? "?"}
              size={80}
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                <Icon name="refresh" className="animate-spin text-white" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="cursor-pointer rounded-lg bg-surface-lighter px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-lighter/80 transition-colors">
              {t("profile.changeAvatar")}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
            </label>
            <p className="text-xs text-text-tertiary">{t("profile.maxSize")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <TextInput
            label={t("profile.updateDisplayName")}
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setHasUnsavedChanges(true);
            }}
            maxLength={32}
            showCounter
          />
          <div className="flex justify-end">
            <PrimaryButton
              onClick={handleUpdateDisplayName}
              disabled={
                isSavingProfile || !hasUnsavedChanges || displayName.length < 3
              }
              loading={isSavingProfile}
              className="w-auto px-8"
            >
              {t("saved").replace("Changes ", "")}
              Save
            </PrimaryButton>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="space-y-6 rounded-2xl border border-white/10 bg-surface/40 p-6">
        <h2 className="text-xl font-semibold text-white">
          {t("preferences")}
        </h2>
        <ThemeColorPicker />
        <div className="h-px w-full bg-white/5" />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-base text-text-primary">
              {t("preferences.music")}
            </div>
            <p className="text-sm text-text-tertiary">
              {user.musicEnabled
                ? t("preferences.musicEnabled")
                : t("preferences.musicDisabled")}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={user.musicEnabled ?? true}
            onClick={() => handleToggleMusic(!(user.musicEnabled ?? true))}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              (user.musicEnabled ?? true) ? "bg-primary" : "bg-zinc-700",
            )}
          >
            <span className="sr-only">{t("preferences.music")}</span>
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                (user.musicEnabled ?? true) ? "translate-x-5" : "translate-x-0",
              )}
            />
          </button>
        </div>
      </section>

      {/* Security Section (Conditional) */}
      {authMethod?.method === "password" && (
        <section className="space-y-6 rounded-2xl border border-white/10 bg-surface/40 p-6">
          <h2 className="text-xl font-semibold text-white">
            {t("security.title")}
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <TextInput
              label={t("security.currentPassword")}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label={t("security.newPassword")}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <TextInput
                label={t("security.confirmNewPassword")}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <p className="text-xs text-text-tertiary">
              {t("security.passwordHelp")}
            </p>
            <div className="flex justify-end">
              <PrimaryButton
                type="submit"
                disabled={isChangingPassword}
                loading={isChangingPassword}
                className="w-auto px-8"
              >
                {t("security.changePassword")}
              </PrimaryButton>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
