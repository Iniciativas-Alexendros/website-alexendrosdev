import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export function WelcomeEmail() {
  return (
    <Html lang="es">
      <Head />
      <Preview>Gracias por suscribirte</Preview>
      <Body style={{ backgroundColor: "#fafafa", fontFamily: "Inter, Arial, sans-serif" }}>
        <Container style={{ padding: "24px", maxWidth: "560px" }}>
          <Heading style={{ fontSize: "20px", color: "#1a2332" }}>
            ¡Gracias por suscribirte!
          </Heading>
          <Text style={{ color: "#4a5568" }}>
            Recibirás mis notas sobre desarrollo web, productos digitales e ingeniería, sin spam.
            Puedes darte de baja en cualquier momento.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;
