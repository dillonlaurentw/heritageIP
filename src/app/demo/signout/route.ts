import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_TOKEN } from "@/lib/demo/self-client";

export function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/demo", request.url));
  res.cookies.delete({ name: COOKIE_TOKEN, path: "/demo" });
  return res;
}
