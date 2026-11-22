import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSION } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const rep = NextResponse.redirect(new URL("/", req.url), 303);
  rep.cookies.set(COOKIE_SESSION, "", { httpOnly: true, path: "/", maxAge: 0, sameSite: "strict" });
  return rep;
}
