import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const usernameRaw = params.email as string;
        if (!usernameRaw) {
          throw new Error("Username is required.");
        }
        const trimmed = usernameRaw.trim();
        if (trimmed.length < 3 || trimmed.length > 24) {
          throw new Error("Username must be between 3 and 24 characters.");
        }
        if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
          throw new Error("Username can only include letters, numbers, and underscores.");
        }

        const name = typeof params.name === "string" ? params.name.trim() : "";

        return {
          email: trimmed,
          username: trimmed,
          usernameLower: trimmed.toLowerCase(),
          ...(name.length > 0 ? { name } : {}),
        };
      },
    }),
    Google,
  ],
});
