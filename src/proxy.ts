import { auth } from "@/auth";
import { isAdminRole } from "@/lib/auth/permissions";

const PUBLIC_PATH_PREFIXES = ["/login"];
const PUBLIC_EXACT_PATHS = ["/"];
const ADMIN_PATH_PREFIX = "/admin";
const COMPANIES_PATH = "/admin/companies";

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

  // Already signed in: the login page sends straight to the dashboard.
  if (req.auth && pathname.startsWith("/login")) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  // Pages check each admin's permissions themselves (requirePageAccess); here only
  // the role: /admin for admins and the super admin, Companies for the super admin.
  const role = req.auth?.user.role;
  if (pathname.startsWith(ADMIN_PATH_PREFIX) && !(role && isAdminRole(role))) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
  if (pathname.startsWith(COMPANIES_PATH) && role !== "SUPER_ADMIN") {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
});

// The PWA files (manifest, service worker, icons, offline page) are public: the
// browser fetches them without a session, and a redirect to /login would break them.
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline.html|icons/|apple-icon).*)"],
};
