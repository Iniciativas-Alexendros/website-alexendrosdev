import { describe, expect, it } from "vitest";
import type { Contact, Deal } from "@prisma/client";
import {
  contactToNotion,
  dealToNotion,
  extractNotionPageId,
  injectNotionPageId,
  notionToContact,
  notionToDeal,
} from "@/lib/crm/notion-mapper";

const CONTACTS_DB = "db-contacts-uuid";
const DEALS_DB = "db-deals-uuid";

const baseContact: Contact = {
  id: "c1",
  type: "INDIVIDUAL",
  status: "LEAD",
  firstName: "Alex",
  lastName: "García",
  email: "alex@example.com",
  phone: "+34600000000",
  company: "Acme",
  position: "CTO",
  website: null,
  notes: "Nota de prueba",
  createdAt: new Date("2026-01-15"),
  updatedAt: new Date("2026-01-15"),
};

const baseDeal: Deal & { stage?: { name: string }; contact?: { firstName: string } } = {
  id: "d1",
  title: "Proyecto web",
  contactId: "c1",
  stageId: "s1",
  value: 12000 as unknown as Deal["value"],
  currency: "eur",
  probability: 60,
  closedAt: null,
  notes: null,
  createdAt: new Date("2026-02-01"),
  updatedAt: new Date("2026-02-01"),
  stage: { name: "Propuesta" },
  contact: { firstName: "Alex" },
};

describe("extractNotionPageId / injectNotionPageId", () => {
  it("extrae notionPageId de notes con tag", () => {
    expect(extractNotionPageId("texto\n[notion:abc-123]")).toBe("abc-123");
  });

  it("devuelve null si no hay tag", () => {
    expect(extractNotionPageId("sin tag")).toBeNull();
    expect(extractNotionPageId(null)).toBeNull();
    expect(extractNotionPageId(undefined)).toBeNull();
  });

  it("inyecta tag en notes vacías", () => {
    expect(injectNotionPageId(null, "page-1")).toBe("[notion:page-1]");
  });

  it("inyecta tag al final de notes existentes", () => {
    expect(injectNotionPageId("texto", "page-2")).toBe("texto\n[notion:page-2]");
  });

  it("reemplaza tag existente", () => {
    expect(injectNotionPageId("texto\n[notion:old]", "new-id")).toBe("texto\n[notion:new-id]");
  });
});

describe("contactToNotion", () => {
  it("mapea todos los campos del contacto", () => {
    const result = contactToNotion(baseContact, CONTACTS_DB);
    expect(result.database_id).toBe(CONTACTS_DB);
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect((props["Nombre"].title as Array<{ text: { content: string } }>)[0].text.content).toBe(
      "Alex",
    );
    expect(
      (props["Apellidos"].rich_text as Array<{ text: { content: string } }>)[0].text.content,
    ).toBe("García");
    expect((props["Email"] as { email: string }).email).toBe("alex@example.com");
    expect((props["Teléfono"] as { phone_number: string }).phone_number).toBe("+34600000000");
    expect((props["Tipo"] as { select: { name: string } }).select.name).toBe("Individual");
    expect((props["Estado"] as { select: { name: string } }).select.name).toBe("Lead");
  });

  it("maneja campos opcionales nulos", () => {
    const minimal: Contact = {
      ...baseContact,
      lastName: null,
      email: null,
      phone: null,
      company: null,
      position: null,
      notes: null,
    };
    const result = contactToNotion(minimal, CONTACTS_DB);
    const props = result.properties as Record<string, unknown>;
    expect(props).not.toHaveProperty("Apellidos");
    expect(props).not.toHaveProperty("Email");
  });
});

describe("notionToContact", () => {
  it("mapea propiedades Notion a Partial<Contact>", () => {
    const props = {
      Nombre: { title: [{ text: { content: "María" } }] },
      Apellidos: { rich_text: [{ text: { content: "López" } }] },
      Email: { email: "maria@example.com" },
      Tipo: { select: { name: "Empresa" } },
      Estado: { select: { name: "Cliente" } },
    };
    const result = notionToContact(props);
    expect(result.firstName).toBe("María");
    expect(result.lastName).toBe("López");
    expect(result.email).toBe("maria@example.com");
    expect(result.type).toBe("COMPANY");
    expect(result.status).toBe("CLIENT");
  });

  it("maneja propiedades vacías", () => {
    expect(notionToContact({})).toEqual({});
  });
});

describe("dealToNotion", () => {
  it("mapea deal con stage y contact", () => {
    const result = dealToNotion(baseDeal, DEALS_DB);
    expect(result.database_id).toBe(DEALS_DB);
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect((props["Nombre"].title as Array<{ text: { content: string } }>)[0].text.content).toBe(
      "Proyecto web",
    );
    expect((props["Valor"] as { number: number }).number).toBe(12000);
    expect((props["Fase"] as { select: { name: string } }).select.name).toBe("Propuesta");
  });
});

describe("notionToDeal", () => {
  it("mapea propiedades Notion a Partial<Deal>", () => {
    const props = {
      Nombre: { title: [{ text: { content: "Retainer" } }] },
      Valor: { number: 5000 },
      Probabilidad: { number: 80 },
      Fase: { select: { name: "Negociación" } },
    };
    const result = notionToDeal(props);
    expect(result.title).toBe("Retainer");
    expect(result.probability).toBe(80);
    expect(result.stageName).toBe("Negociación");
  });
});
