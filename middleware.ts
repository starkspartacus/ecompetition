import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Store the HTTP server reference globally for Socket.IO
  // @ts-ignore
  if (!global.__httpServer && request.nextUrl.pathname === "/api/socket/io") {
    // @ts-ignore
    global.__httpServer = (request as any).socket?.server;
  }

  // Existing middleware logic
  const token = request.cookies.get("next-auth.session-token");
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/signin") ||
    request.nextUrl.pathname.startsWith("/signup");
  const isDashboard =
    request.nextUrl.pathname.startsWith("/organizer") ||
    request.nextUrl.pathname.startsWith("/participant");

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/organizer/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/organizer/:path*",
    "/participant/:path*",
    "/signin",
    "/signup",
    "/api/socket/io",
  ],
};
