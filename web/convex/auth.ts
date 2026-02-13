import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const emailRaw = params.email;
        if (typeof emailRaw !== "string") {
          throw new Error("Email is required.");
        }

        const name = typeof params.name === "string" ? params.name.trim() : "";

        return {
          email: emailRaw.trim().toLowerCase(),
          ...(name.length > 0 ? { name } : {}),
        };
      },
    }),
    Google,
  ],
});
