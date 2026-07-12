import { z } from "zod";

// Honeypot: el campo `website` debe llegar vacío (los bots lo rellenan).
const honeypot = z.string().max(0).optional();

const utmField = z
  .string()
  .regex(/^[\w-]*$/, "Valor UTM no válido.")
  .max(120)
  .optional();

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Indica tu nombre.").max(120),
  email: z.email("Email no válido.").max(200),
  type: z.string().trim().max(60).optional(),
  message: z.string().trim().min(1, "Cuéntame algo del proyecto.").max(5000),
  consent: z.literal(true, { error: "Debes aceptar la política." }),
  website: honeypot,
  utmSource: utmField,
  utmMedium: utmField,
  utmCampaign: utmField,
  utmTerm: utmField,
  utmContent: utmField,
});

export type ContactInput = z.infer<typeof contactSchema>;

export const newsletterSchema = z.object({
  email: z.email("Email no válido.").max(200),
  website: honeypot,
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

// Checkout: el cliente solo envía el id del item; el precio lo resuelve el
// servidor desde el catálogo (`lib/content/catalog.ts`). Nunca confíes en un
// importe enviado por el cliente.
//
// F12: ampliado con `itemId` (preferido), `mode` (payment|subscription) y
// `paymentMethod` (stripe|transfer). El campo legacy `item` se mantiene por
// compatibilidad hacia atrás.
export const checkoutSchema = z
  .object({
    itemId: z.string().trim().min(1, "Falta el item.").max(80).optional(),
    item: z.string().trim().min(1).max(80).optional(),
    mode: z.enum(["payment", "subscription"]).optional(),
    paymentMethod: z.enum(["stripe", "transfer"]).optional(),
    email: z.string().email("Email no válido.").max(200).optional(),
    name: z.string().trim().max(120).optional(),
  })
  .refine((d) => !!(d.itemId || d.item), {
    message: "Falta el item.",
    path: ["itemId"],
  })
  .refine((d) => d.paymentMethod !== "transfer" || (!!d.email && !!d.name), {
    message: "Email y nombre requeridos para transferencia.",
    path: ["email"],
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Aplana errores de zod a `{ campo: mensaje }` para devolver al cliente. */
export function flattenErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// ─── F14 — Schemas CRM ─────────────────────────────────────────────────────

export const crmContactSchema = z.object({
  type: z.enum(["INDIVIDUAL", "COMPANY"]).optional(),
  firstName: z.string().trim().min(1, "Indica el nombre.").max(120),
  lastName: z.string().trim().max(120).optional(),
  email: z.string().email("Email no válido.").max(200).optional(),
  phone: z.string().trim().max(30).optional(),
  company: z.string().trim().max(200).optional(),
  position: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(5000).optional(),
});

export type CrmContactInput = z.infer<typeof crmContactSchema>;

export const crmDealSchema = z.object({
  title: z.string().trim().min(1, "Indica el título.").max(200),
  contactId: z.string().uuid("ID de contacto inválido."),
  value: z.number().int().min(0).optional(),
  currency: z.string().max(3).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  notes: z.string().trim().max(5000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid("ID de producto inválido.").optional(),
        quantity: z.number().int().min(1).default(1),
        unitPrice: z.number().int().min(0).optional(),
        notes: z.string().trim().max(500).optional(),
      }),
    )
    .optional(),
});

export type CrmDealInput = z.infer<typeof crmDealSchema>;

export const crmDealPatchSchema = z.object({
  stageId: z.string().uuid().optional(),
  probability: z.number().int().min(0).max(100).optional(),
  notes: z.string().trim().max(5000).optional(),
  closedAt: z.string().datetime().optional(),
});

export type CrmDealPatchInput = z.infer<typeof crmDealPatchSchema>;

export const crmProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  unitPrice: z.number().min(0),
  currency: z.string().max(3).optional(),
  active: z.boolean().optional(),
});

export type CrmProductInput = z.infer<typeof crmProductSchema>;

export const crmInvoiceSchema = z
  .object({
    contactId: z.string().uuid("ID de contacto inválido.").optional(),
    dealId: z.string().uuid("ID de deal inválido.").optional(),
    notes: z.string().trim().max(2000).optional(),
    taxRate: z.number().min(0).max(1).optional(),
    items: z
      .array(
        z.object({
          description: z.string().trim().min(1, "Descripción requerida.").max(500),
          quantity: z.number().int().min(1),
          unitPrice: z.number().min(0),
          productId: z.string().uuid().optional(),
        }),
      )
      .min(1, "Al menos un item requerido."),
  })
  .refine((d) => !!(d.contactId || d.dealId), {
    message: "Se requiere contactId o dealId.",
    path: ["contactId"],
  });

export type CrmInvoiceInput = z.infer<typeof crmInvoiceSchema>;

export const crmInvoicePatchSchema = z.object({
  status: z.enum(["sent", "paid", "cancelled"]),
  paidAt: z.string().datetime().optional(),
});

export type CrmInvoicePatchInput = z.infer<typeof crmInvoicePatchSchema>;

export const crmTaskSchema = z.object({
  title: z.string().trim().min(1, "Indica el título.").max(200),
  description: z.string().trim().max(5000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  contactId: z.string().uuid("ID de contacto inválido.").optional(),
  dealId: z.string().uuid("ID de deal inválido.").optional(),
});

export type CrmTaskInput = z.infer<typeof crmTaskSchema>;

// ─── P1.6 — Newsletter admin (envío manual) ──────────────────────────────────

export const newsletterSendSchema = z.object({
  subject: z.string().trim().min(1, "Indica el asunto.").max(200),
  // El cuerpo del email: texto plano o HTML sencillo. Mantenido simple a
  // propósito; si se quiere Markdown se añade un parser más adelante.
  body: z.string().trim().min(1, "Indica el cuerpo.").max(50_000),
  dryRun: z.boolean().optional(),
});

export type NewsletterSendInput = z.infer<typeof newsletterSendSchema>;
