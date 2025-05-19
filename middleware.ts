import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
  if (
    !token &&
    !request.nextUrl.pathname.startsWith("/signin") &&
    !request.nextUrl.pathname.startsWith("/signup")
  ) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Vérifier les accès spécifiques aux rôles
  if (token) {
    // Routes uniquement pour les organisateurs
    if (
      request.nextUrl.pathname.startsWith("/organizer") &&
      token.role !== "ORGANIZER"
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Routes uniquement pour les participants
    if (
      request.nextUrl.pathname.startsWith("/participant") &&
      token.role !== "PARTICIPANT"
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

// Configurer les routes concernées par le middleware
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
