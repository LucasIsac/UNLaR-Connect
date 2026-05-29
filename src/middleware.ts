import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Define paths that require authentication
const protectedRoutes = [
  "/dashboard",
  "/recursos",
  "/asistente",
  "/foro",
  "/tutorias",
  "/eventos",
  "/perfil",
  "/apuntes",
  "/chat",
  "/ranking",
  "/karma",
  "/materias",
  "/carreras",
];

// Define auth-only paths (e.g., login, register)
const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request,
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const nextUrl = request.nextUrl;
    const path = nextUrl.pathname;

    const isProtectedRoute = protectedRoutes.some((route) =>
      path.startsWith(route)
    );
    const isAuthRoute = authRoutes.some((route) => path.startsWith(route));

    if (isProtectedRoute && !user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", path);
      return NextResponse.redirect(loginUrl);
    }

    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, svgs, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
