import {
  convexAuthNextjsMiddleware,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { hasLocale } from "next-intl";
import createMiddleware from "next-intl/middleware";

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
  },
);

type IntlRequest = Parameters<typeof handleI18nRouting>[0];
type AuthRequest = Parameters<typeof authMiddleware>[0];
type AuthEvent = Parameters<typeof authMiddleware>[1];

function isPublicPath(pathname: string): boolean {
  const maybeLocale = pathname.split("/")[1];
  const locale = hasLocale(routing.locales, maybeLocale)
    ? maybeLocale
    : routing.defaultLocale;

  return (
    pathname === "/" ||
    pathname === `/${locale}` ||
    pathname.startsWith(`/${locale}/auth`) ||
    pathname.startsWith("/api/auth")
  );
}

export default async function proxy(request: IntlRequest, event: AuthEvent) {
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return authMiddleware(request as unknown as AuthRequest, event);
  }

  const i18nResponse = handleI18nRouting(request);

  if (i18nResponse.status >= 300 && i18nResponse.status < 400) {
    return i18nResponse;
  }

  if (isPublicPath(request.nextUrl.pathname)) {
    return i18nResponse;
  }

  const authResponse = await authMiddleware(
    request as unknown as AuthRequest,
    event,
  );
  if (authResponse) {
    return authResponse;
  }

  return i18nResponse;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
