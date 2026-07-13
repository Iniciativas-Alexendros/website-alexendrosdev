## Checklist

- [ ] El código compila sin errores (`pnpm typecheck`)
- [ ] ESLint pasa con 0 errores (`pnpm lint`)
- [ ] Tests pasan con cobertura de gate (`pnpm test:coverage`)
- [ ] El build de producción completa (`pnpm build`)
- [ ] No hay imports rotos ni archivos huérfanos
- [ ] Las variables de entorno nuevas están en `.env.example`
- [ ] Los cambios de API tienen tests de integración
- [ ] Las migraciones de BD son reversibles (o hay plan de rollback)
- [ ] No se incluyen secretos ni tokens en el diff

### Si aplica

- [ ] Nuevas dependencias auditadas (`pnpm audit --audit-level=high`)
- [ ] Cambios de UI verificados en preview deploy de Vercel
- [ ] Cambios de schema de BD con migración Prisma generada
- [ ] Endpoints nuevos tienen rate-limit donde corresponda
- [ ] Webhooks nuevos verifican firma
