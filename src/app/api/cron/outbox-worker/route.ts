import { NextResponse } from "next/server";
import { runOutboxWorker } from "@/lib/services/outbox-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const result = await runOutboxWorker();

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
