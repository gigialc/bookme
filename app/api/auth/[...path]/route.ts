import { NextRequest } from "next/server";
import { getAuth } from "@/lib/neon-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return getAuth().handler().GET(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return getAuth().handler().POST(req, ctx);
}
