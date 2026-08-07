import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface LeadNotificationProps {
  name: string;
  email: string;
  type?: string;
  message: string;
}

export function LeadNotification({ name, email, type, message }: LeadNotificationProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>Nuevo contacto de {name}</Preview>
      <Body style={{ backgroundColor: "#fafafa", fontFamily: "Inter, Arial, sans-serif" }}>
        <Container style={{ padding: "24px", maxWidth: "560px" }}>
          <Heading style={{ fontSize: "20px", color: "#1a2332" }}>
            Nuevo mensaje de contacto
          </Heading>
          <Section>
            <Text style={{ margin: "4px 0", color: "#4a5568" }}>
              <strong>Nombre:</strong> {name}
            </Text>
            <Text style={{ margin: "4px 0", color: "#4a5568" }}>
              <strong>Email:</strong> {email}
            </Text>
            <Text style={{ margin: "4px 0", color: "#4a5568" }}>
              <strong>Tipo:</strong> {type ?? "—"}
            </Text>
          </Section>
          <Hr />
          <Text style={{ whiteSpace: "pre-wrap", color: "#1a2332" }}>{message}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default LeadNotification;
