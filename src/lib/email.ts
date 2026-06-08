import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

// Cliente Resend instanciado solo si hay API key; null en caso contrario
// (los route handlers degradan: registran en log y no envían).
export const resend: Resend | null = apiKey ? new Resend(apiKey) : null;

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Portfolio <onboarding@resend.dev>";
export const CONTACT_TO = process.env.CONTACT_TO_EMAIL ?? "contacto@alexendros.pro";
