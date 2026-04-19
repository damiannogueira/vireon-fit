/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Activá tu cuenta de Vireon Fit y empezá a subir de nivel</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>VIREON FIT</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Bienvenido, atleta 💪</Heading>
          <Text style={text}>
            Gracias por unirte a{' '}
            <Link href={siteUrl} style={link}>
              <strong>{siteName}</strong>
            </Link>
            . Tu progreso RPG arranca acá.
          </Text>
          <Text style={text}>
            Confirmá tu email (<strong>{recipient}</strong>) para desbloquear tu primer entrenamiento:
          </Text>
          <Section style={buttonWrap}>
            <Button style={button} href={confirmationUrl}>
              VERIFICAR EMAIL
            </Button>
          </Section>
          <Text style={footer}>
            Si no creaste una cuenta, podés ignorar este mensaje.
          </Text>
        </Section>
        <Text style={signature}>— El equipo de Vireon Fit</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', padding: '20px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const header = { textAlign: 'center' as const, padding: '24px 0' }
const brand = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  letterSpacing: '4px',
  color: '#39FF14',
  margin: 0,
}
const card = {
  backgroundColor: '#0F0F1A',
  borderRadius: '16px',
  padding: '32px 28px',
  border: '1px solid #8B5CF6',
}
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#ffffff', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#CBD5E1', lineHeight: '1.6', margin: '0 0 18px' }
const link = { color: '#39FF14', textDecoration: 'none' }
const buttonWrap = { textAlign: 'center' as const, margin: '28px 0' }
const button = {
  backgroundColor: '#39FF14',
  color: '#0F0F1A',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  letterSpacing: '1px',
  borderRadius: '10px',
  padding: '14px 32px',
  textDecoration: 'none',
  textTransform: 'uppercase' as const,
}
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0', textAlign: 'center' as const }
const signature = { fontSize: '12px', color: '#64748B', textAlign: 'center' as const, margin: '20px 0 0' }
