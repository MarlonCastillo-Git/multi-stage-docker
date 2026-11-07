import { NextRequest, NextResponse } from "next/server";

// This is an early UX check, not authorization. The API verifies the JWT
// again for every protected read and every mutation.
export function proxy(request: NextRequest) {
  if (!request.cookies.get("ecommerce_session")?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout/:path*", "/pedidos/:path*", "/confirmacion/:path*"],
};
