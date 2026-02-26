import { auth } from "@/app/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (!req.auth && req.nextUrl.pathname !== "/login") {
    const newUrl = new URL("/login", req.nextUrl.origin)
    return Response.redirect(newUrl)
  }

  // If authenticated, check role-based access
  if (req.auth) {
    const userRole = req.auth.user.role; // Extract the role from the session

    // Viewer disallowed paths.
    const notAllowedPaths = {
      superadmin: [],
      administrator: [],
      editor: ['/data-download', '/data-upload'],
      viewer: ['/data-download', '/data-upload'],
    };

    // Check access if the user's role matches disallowed paths
    const notAllowed = notAllowedPaths[userRole].some((path) =>
      pathname.startsWith(path)
    );

    if (notAllowed) {
      const newUrl = new URL("/unauthorized", req.nextUrl.origin); // Redirect to unauthorized page
      return Response.redirect(newUrl);
    }
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|forgot-password).*)"],
};