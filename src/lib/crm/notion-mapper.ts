import type { Contact, Deal } from "@prisma/client";
import type { CreatePageParameters } from "@notionhq/client/build/src/api-endpoints";

type NotionProperties = CreatePageParameters["properties"];

/**
 * Extrae el notionPageId de las notes de un Contact/Deal.
 * Busca tag `[notion:XXXX]` al final del string.
 */
export function extractNotionPageId(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const match = notes.match(/\[notion:([a-zA-Z0-9-]+)\]\s*$/);
  return match?.[1] ?? null;
}

/**
 * Inyecta o actualiza el tag `[notion:XXXX]` en las notes.
 */
export function injectNotionPageId(notes: string | null | undefined, notionPageId: string): string {
  const clean = (notes ?? "").replace(/\s*\[notion:[a-zA-Z0-9-]+\]\s*$/, "").trim();
  return clean ? `${clean}\n[notion:${notionPageId}]` : `[notion:${notionPageId}]`;
}

const CONTACT_TYPE_MAP: Record<string, string> = {
  INDIVIDUAL: "Individual",
  COMPANY: "Empresa",
};

const CONTACT_STATUS_MAP: Record<string, string> = {
  LEAD: "Lead",
  PROSPECT: "Prospecto",
  CLIENT: "Cliente",
  PARTNER: "Partner",
  INACTIVE: "Inactivo",
};

/**
 * Convierte un Contact de Prisma a propiedades de página Notion.
 */
export function contactToNotion(
  contact: Contact,
  contactsDbId: string,
): {
  database_id: string;
  properties: NotionProperties;
} {
  const props: NotionProperties = {
    Nombre: { title: [{ text: { content: contact.firstName } }] },
  };

  if (contact.lastName) {
    props["Apellidos"] = {
      rich_text: [{ text: { content: contact.lastName } }],
    };
  }
  if (contact.email) {
    props["Email"] = { email: contact.email };
  }
  if (contact.phone) {
    props["Teléfono"] = { phone_number: contact.phone };
  }
  if (contact.company) {
    props["Empresa"] = {
      rich_text: [{ text: { content: contact.company } }],
    };
  }
  if (contact.position) {
    props["Cargo"] = {
      rich_text: [{ text: { content: contact.position } }],
    };
  }
  if (contact.type) {
    props["Tipo"] = {
      select: { name: CONTACT_TYPE_MAP[contact.type] ?? contact.type },
    };
  }
  if (contact.status) {
    props["Estado"] = {
      select: { name: CONTACT_STATUS_MAP[contact.status] ?? contact.status },
    };
  }
  if (contact.notes) {
    const cleanNotes = contact.notes.replace(/\s*\[notion:[a-zA-Z0-9-]+\]\s*$/, "").trim();
    if (cleanNotes) {
      props["Notas"] = {
        rich_text: [{ text: { content: cleanNotes.slice(0, 2000) } }],
      };
    }
  }
  props["Creado"] = {
    date: { start: contact.createdAt.toISOString() },
  };

  return { database_id: contactsDbId, properties: props };
}

/**
 * Convierte una página de Notion a un Partial<Contact> para Prisma.
 */
export function notionToContact(properties: Record<string, unknown>): Partial<Contact> {
  const result: Partial<Contact> = {};

  const nombre = properties["Nombre"] as
    { title?: Array<{ text?: { content?: string } }> } | undefined;
  if (nombre?.title?.[0]?.text?.content) {
    result.firstName = nombre.title[0].text.content;
  }

  const apellidos = properties["Apellidos"] as
    { rich_text?: Array<{ text?: { content?: string } }> } | undefined;
  if (apellidos?.rich_text?.[0]?.text?.content) {
    result.lastName = apellidos.rich_text[0].text.content;
  }

  const email = properties["Email"] as { email?: string } | undefined;
  if (email?.email) {
    result.email = email.email;
  }

  const telefono = properties["Teléfono"] as { phone_number?: string } | undefined;
  if (telefono?.phone_number) {
    result.phone = telefono.phone_number;
  }

  const empresa = properties["Empresa"] as
    { rich_text?: Array<{ text?: { content?: string } }> } | undefined;
  if (empresa?.rich_text?.[0]?.text?.content) {
    result.company = empresa.rich_text[0].text.content;
  }

  const tipo = properties["Tipo"] as { select?: { name?: string } } | undefined;
  if (tipo?.select?.name) {
    const reverseMap: Record<string, string> = { Individual: "INDIVIDUAL", Empresa: "COMPANY" };
    result.type = (reverseMap[tipo.select.name] ?? "INDIVIDUAL") as Contact["type"];
  }

  const estado = properties["Estado"] as { select?: { name?: string } } | undefined;
  if (estado?.select?.name) {
    const reverseMap: Record<string, string> = {
      Lead: "LEAD",
      Prospecto: "PROSPECT",
      Cliente: "CLIENT",
      Partner: "PARTNER",
      Inactivo: "INACTIVE",
    };
    result.status = (reverseMap[estado.select.name] ?? "LEAD") as Contact["status"];
  }

  return result;
}

/**
 * Convierte un Deal de Prisma a propiedades de página Notion.
 */
export function dealToNotion(
  deal: Deal & { stage?: { name: string } | null; contact?: { firstName: string } | null },
  dealsDbId: string,
): {
  database_id: string;
  properties: NotionProperties;
} {
  const props: NotionProperties = {
    Nombre: { title: [{ text: { content: deal.title } }] },
    Valor: { number: Number(deal.value) },
    Probabilidad: { number: deal.probability },
  };

  if (deal.stage?.name) {
    props["Fase"] = { select: { name: deal.stage.name } };
  }

  if (deal.contact?.firstName) {
    props["Contacto"] = {
      rich_text: [{ text: { content: deal.contact.firstName } }],
    };
  }

  if (deal.closedAt) {
    props["Cerrado"] = { date: { start: deal.closedAt.toISOString() } };
  }

  if (deal.notes) {
    const cleanNotes = deal.notes.replace(/\s*\[notion:[a-zA-Z0-9-]+\]\s*$/, "").trim();
    if (cleanNotes) {
      props["Notas"] = {
        rich_text: [{ text: { content: cleanNotes.slice(0, 2000) } }],
      };
    }
  }

  return { database_id: dealsDbId, properties: props };
}

/**
 * Convierte una página de Notion a un Partial<Deal> para Prisma.
 */
export function notionToDeal(
  properties: Record<string, unknown>,
): Partial<Deal> & { stageName?: string } {
  const result: Partial<Deal> & { stageName?: string } = {};

  const nombre = properties["Nombre"] as
    { title?: Array<{ text?: { content?: string } }> } | undefined;
  if (nombre?.title?.[0]?.text?.content) {
    result.title = nombre.title[0].text.content;
  }

  const valor = properties["Valor"] as { number?: number } | undefined;
  if (valor?.number !== undefined) {
    result.value = valor.number as unknown as Deal["value"];
  }

  const prob = properties["Probabilidad"] as { number?: number } | undefined;
  if (prob?.number !== undefined) {
    result.probability = prob.number;
  }

  const fase = properties["Fase"] as { select?: { name?: string } } | undefined;
  if (fase?.select?.name) {
    result.stageName = fase.select.name;
  }

  return result;
}
