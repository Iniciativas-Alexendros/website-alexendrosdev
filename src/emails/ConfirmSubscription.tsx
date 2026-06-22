import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

// Email de confirmación del double opt-in: NO es la bienvenida. Solo cuando el
// dueño real del buzón pulsa el botón se confirma la suscripción.
export function ConfirmSubscription({ confirmUrl }: { confirmUrl: string }) {
  return (
    <Html lang="es">
      <Head />
      <Preview>Confirma tu suscripción</Preview>
      <Body style={{ backgroundColor: "#fafafa", fontFamily: "Inter, Arial, sans-serif" }}>
        <Container style={{ padding: "24px", maxWidth: "560px" }}>
          <Heading style={{ fontSize: "20px", color: "#1a2332" }}>Confirma tu suscripción</Heading>
          <Text style={{ color: "#4a5568" }}>
            Pulsa el botón para confirmar que quieres recibir mis notas sobre desarrollo web,
            productos digitales e ingeniería. Si no has sido tú, ignora este correo: sin confirmar,
            no se enviará nada más.
          </Text>
          <Button
            href={confirmUrl}
            style={{
              backgroundColor: "#1a2332",
              color: "#ffffff",
              padding: "12px 20px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            Confirmar suscripción
          </Button>
          <Text style={{ color: "#94a3b8", fontSize: "12px", marginTop: "16px" }}>
            El enlace caduca en 48 horas.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ConfirmSubscription;
