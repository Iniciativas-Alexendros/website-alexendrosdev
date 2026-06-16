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
// servidor desde el catálogo (`lib/content/checkout.ts`). Nunca confíes en un
// importe enviado por el cliente.
export const checkoutSchema = z.object({
  item: z.string().trim().min(1, "Falta el item.").max(80),
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
