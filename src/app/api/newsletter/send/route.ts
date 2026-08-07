import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resend } from "@/lib/email";
import { requireCrmAuth } from "@/lib/crm-auth";
import { newsletterSendSchema, flattenErrors } from "@/lib/validation";
import { publishOutboxEventInTransaction } from "@/lib/services/outbox";

export const runtime = "nodejs";

// F18.5 / P1.6 — Envío manual de la newsletter.
//
// POST /api/newsletter/send
// Auth: header `X-API-Key` validado por `requireCrmAuth` (misma clave que el
// CRM API: `CRM_API_KEY`). Rate-limit heredado del auth CRM (60 req/min por
// clave) más el de IP en la propia auth (30 req/min).
//
// Body JSON:
//   {
//     "subject": "Asunto del email",
//     "body": "Cuerpo del email en texto plano (los párrafos se separan por
//               una línea en blanco).",
//     "dryRun": true   // opcional: NO envía, solo cuenta destinatarios
//   }
//
// Solo se envía a suscriptores con `confirmed: true` (double opt-in cumplido).
// Si Resend no está configurado y `dryRun` no es true → 503.
//
// Respuestas:
//   201 — enviado (o en cola) a N destinatarios
//   422 — payload inválido
//   500 — error de BD / envío
//   503 — Resend no configurado y no es dryRun
export async function POST(req: Request) {
  const authErr = requireCrmAuth(req);
  if (authErr) return authErr;

  if (!prisma) {
    return NextResponse.json({ error: "Base de datos no disponible." }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de petición inválido." }, { status: 400 });
  }

  const parsed = newsletterSendSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Solicitud inválida.", fields: flattenErrors(parsed.error) },
      { status: 422 },
    );
  }

  const { subject, body, dryRun } = parsed.data;

  // Listar destinatarios: solo confirmados (double opt-in cumplido).
  let recipients: { email: string }[];
  try {
    recipients = await prisma.subscriber.findMany({
      where: { confirmed: true },
      select: { email: true },
    });
  } catch (err) {
    console.error("[newsletter/send] error al listar suscriptores:", err);
    return NextResponse.json(
      { error: "No se pudo acceder a la lista de suscriptores." },
      { status: 500 },
    );
  }

  if (recipients.length === 0) {
    return NextResponse.json(
      {
        ok: true,
        sent: 0,
        recipients: 0,
        note: "Sin destinatarios confirmados.",
      },
      { status: 200 },
    );
  }

  // Dry-run: solo informa, no envía.
  if (dryRun) {
    return NextResponse.json(
      { ok: true, dryRun: true, recipients: recipients.length },
      { status: 200 },
    );
  }

  if (!resend) {
    return NextResponse.json(
      {
        error: "Resend no está configurado. Configura RESEND_API_KEY o usa dryRun=true.",
      },
      { status: 503 },
    );
  }

  // Encolar emails en outbox para envío asíncrono con retry/backoff.
  // Cada destinatario recibe un evento independiente para aislar fallos.
  try {
    await prisma.$transaction(async (tx) => {
      for (const r of recipients) {
        await publishOutboxEventInTransaction(tx, "send_email", "Subscriber", r.email, {
          template: "newsletter",
          subject,
          body,
        });
      }
    });
  } catch (err) {
    console.error("[newsletter/send] error al encolar emails:", err);
    return NextResponse.json(
      { error: "No se pudo encolar el envío. Inténtalo más tarde." },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      queued: recipients.length,
      recipients: recipients.length,
      note: "Emails encolados para envío asíncrono vía outbox worker.",
    },
    { status: 201 },
  );
}
