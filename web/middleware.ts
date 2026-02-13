import createMiddleware from "next-intl/middleware";
import { hasLocale } from "next-intl";
import {
  convexAuthNextjsMiddleware,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const authMiddleware = convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    const pathname = request.nextUrl.pathname;
    const maybeLocale = pathname.split("/")[1];
    const locale = hasLocale(routing.locales, maybeLocale)
      ? maybeLocale
      : routing.defaultLocale;

    const isPublicPath =
      pathname === "/" ||
      pathname === `/${locale}` ||
      pathname.startsWith(`/${locale}/auth`) ||
      pathname.startsWith("/api/auth");

    if (isPublicPath) {
      return;
    }

    if (!(await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, `/${locale}/auth`);
    }
  }
);

type IntlRequest = Parameters<typeof handleI18nRouting>[0];
type AuthRequest = Parameters<typeof authMiddleware>[0];
type AuthEvent = Parameters<typeof authMiddleware>[1];

export default async function middleware(
  request: IntlRequest,
  event: AuthEvent
) {
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return authMiddleware(request as unknown as AuthRequest, event);
  }

  const i18nResponse = handleI18nRouting(request);

  if (i18nResponse.status >= 300 && i18nResponse.status < 400) {
    return i18nResponse;
  }

  const authResponse = await authMiddleware(
    request as unknown as AuthRequest,
    event
  );
  if (authResponse) {
    return authResponse;
  }

  return i18nResponse;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
