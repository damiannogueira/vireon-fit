/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu código de verificación de Vireon Fit</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>VIREON FIT</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>🔑 Código de verificación</Heading>
          <Text style={text}>Usá este código para confirmar tu identidad:</Text>
          <Text style={codeStyle}>{token}</Text>
          <Text style={footer}>
            Este código expira pronto. Si no lo pediste, podés ignorar este email.
          </Text>
        </Section>
        <Text style={signature}>— El equipo de Vireon Fit</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', padding: '20px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const header = { textAlign: 'center' as const, padding: '24px 0' }
const brand = { fontSize: '24px', fontWeight: 'bold' as const, letterSpacing: '4px', color: '#39FF14', margin: 0 }
const card = {
  backgroundColor: '#0F0F1A',
  borderRadius: '16px',
  padding: '32px 28px',
  border: '1px solid #8B5CF6',
  textAlign: 'center' as const,
}
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#ffffff', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#CBD5E1', lineHeight: '1.6', margin: '0 0 18px' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: '#39FF14',
  letterSpacing: '8px',
  backgroundColor: '#1A1A2E',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #8B5CF6',
  margin: '0 0 24px',
}
const footer = { fontSize: '12px', color: '#94A3B8', margin: '12px 0 0' }
const signature = { fontSize: '12px', color: '#64748B', textAlign: 'center' as const, margin: '20px 0 0' }
