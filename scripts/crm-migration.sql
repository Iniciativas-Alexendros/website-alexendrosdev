-- 4 ENUMs
CREATE TYPE "ContactType" AS ENUM ('LEAD', 'CUSTOMER', 'PROSPECT');
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "ActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TABLE "Contact" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "phone" TEXT,
  "company" TEXT,
  "type" "ContactType" NOT NULL DEFAULT 'LEAD',
  "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
  "tags" TEXT[] DEFAULT '{}',
  "customFields" JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Product" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PipelineStage" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "color" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Deal" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "value" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "stageId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "ownerId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "expectedCloseDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id"),
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id")
);

CREATE TABLE "DealItem" (
  "id" TEXT PRIMARY KEY,
  "dealId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE,
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
);

CREATE TABLE "Activity" (
  "id" TEXT PRIMARY KEY,
  "contactId" TEXT,
  "dealId" TEXT,
  "type" "ActivityType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE,
  FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE
);

CREATE TABLE "Task" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "dueDate" TIMESTAMP(3),
  "assigneeId" TEXT,
  "contactId" TEXT,
  "dealId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL,
  FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL
);

CREATE TABLE "Invoice" (
  "id" TEXT PRIMARY KEY,
  "number" TEXT UNIQUE NOT NULL,
  "contactId" TEXT NOT NULL,
  "dealId" TEXT,
  "subtotal" INTEGER NOT NULL,
  "tax" INTEGER NOT NULL DEFAULT 0,
  "total" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id"),
  FOREIGN KEY ("dealId") REFERENCES "Deal"("id")
);

CREATE TABLE "InvoiceItem" (
  "id" TEXT PRIMARY KEY,
  "invoiceId" TEXT NOT NULL,
  "productId" TEXT,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE,
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
);

CREATE INDEX "Contact_email_idx" ON "Contact"("email");
CREATE INDEX "Contact_type_idx" ON "Contact"("type");
CREATE INDEX "Contact_status_idx" ON "Contact"("status");
CREATE INDEX "Deal_stageId_idx" ON "Deal"("stageId");
CREATE INDEX "Deal_contactId_idx" ON "Deal"("contactId");
CREATE INDEX "Deal_status_idx" ON "Deal"("status");
CREATE INDEX "Activity_contactId_idx" ON "Activity"("contactId");
CREATE INDEX "Activity_dealId_idx" ON "Activity"("dealId");
CREATE INDEX "Activity_type_idx" ON "Activity"("type");
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");
CREATE INDEX "Task_completed_idx" ON "Task"("completed");
CREATE INDEX "Invoice_contactId_idx" ON "Invoice"("contactId");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
