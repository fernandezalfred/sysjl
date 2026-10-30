import { auth } from "@/auth";

const PUBLIC_PATH_PREFIXES = ["/login"];
const PUBLIC_EXACT_PATHS = ["/"];
const ADMIN_PATH_PREFIX = "/admin";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublicPath =
    PUBLIC_EXACT_PATHS.includes(pathname) ||
    PUBLIC_PATH_PREFIXES.some((path) => pathname.startsWith(path));

  if (!req.auth && !isPublicPath) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  if (pathname.startsWith(ADMIN_PATH_PREFIX) && req.auth?.user.role !== "ADMIN") {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
