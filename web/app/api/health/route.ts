import { NextResponse } from "next/server";

/**
 * Health-check endpoint for uptime monitors and post-deploy smoke tests.
 * Returns 200 with basic status info.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ? "configured" : "missing",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
