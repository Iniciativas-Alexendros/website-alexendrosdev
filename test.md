# Test de integración CodeRabbit

Archivo de prueba para validar el review local de CodeRabbit.

```typescript
// TODO: Este código tiene intencionalmente problemas para el review
export function calculateTotal(items: any[], discount: number) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  // Bug: no validate discount
  return total - discount;
}
```
