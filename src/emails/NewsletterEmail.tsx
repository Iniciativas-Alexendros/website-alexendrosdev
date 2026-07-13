import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export interface NewsletterEmailProps {
  subject: string;
  body: string;
}

export function NewsletterEmail({ subject, body }: NewsletterEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{subject}</Preview>
      <Body
        style={{
          backgroundColor: "#fafafa",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <Container style={{ padding: "24px", maxWidth: "560px" }}>
          <Heading style={{ fontSize: "20px", color: "#1a2332", marginTop: 0 }}>{subject}</Heading>
          {body.split("\n\n").map((paragraph, i) => (
            <Text key={`para-${i}`} style={{ color: "#4a5568", lineHeight: 1.6 }}>
              {paragraph}
            </Text>
          ))}
          <Text style={{ color: "#9aa3b2", fontSize: "12px", marginTop: 32 }}>
            Recibiste este email porque te suscribiste a la newsletter de alexendros.dev. Para dejar
            de recibir estos emails, responde a este mensaje indicando &ldquo;baja&rdquo;.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default NewsletterEmail;
