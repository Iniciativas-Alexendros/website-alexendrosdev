-- Seed 9 pipeline stages (freelancing realista)
-- Source: prisma/migrations/20260709000001_seed_pipeline_stages

INSERT INTO "PipelineStage" ("id", "name", "description", "order", "color", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Nuevo',          'Lead captado: formulario web, email, referencia.',             0, '#6b7280', NOW(), NOW()),
  (gen_random_uuid(), 'Contactado',     'Primer contacto realizado (email o llamada).',                  1, '#3b82f6', NOW(), NOW()),
  (gen_random_uuid(), 'Discovery call', 'Llamada de descubrimiento para entender el problema real.',    2, '#8b5cf6', NOW(), NOW()),
  (gen_random_uuid(), 'Propuesta',      'Propuesta técnica y económica enviada al cliente.',            3, '#f59e0b', NOW(), NOW()),
  (gen_random_uuid(), 'Negociación',    'Ajustando alcance, precio o condiciones con el cliente.',       4, '#f97316', NOW(), NOW()),
  (gen_random_uuid(), 'Cerrado ganado', 'Contrato firmado o primer pago recibido.',                     5, '#10b981', NOW(), NOW()),
  (gen_random_uuid(), 'Onboarding',     'Kick-off: acceso a repos, herramientas, expectativas.',       6, '#06b6d4', NOW(), NOW()),
  (gen_random_uuid(), 'En progreso',    'Desarrollo activo: iteraciones, demos, feedback.',             7, '#3b82f6', NOW(), NOW()),
  (gen_random_uuid(), 'Entregado',      'Entrega final, documentación y soporte post-lanzamiento.',    8, '#84cc16', NOW(), NOW()),
  (gen_random_uuid(), 'Cerrado perdido','Oportunidad perdida. Admite ramal desde stage 3+.',            9, '#ef4444', NOW(), NOW());
