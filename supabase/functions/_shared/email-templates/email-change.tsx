/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Confirmá el cambio de email para {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>VIREON FIT</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>✉️ Confirmá tu nuevo email</Heading>
          <Text style={text}>
            Pediste cambiar tu email en <strong>{siteName}</strong> de{' '}
            <strong style={highlight}>{email}</strong> a{' '}
            <strong style={highlight}>{newEmail}</strong>.
          </Text>
          <Section style={buttonWrap}>
            <Button style={button} href={confirmationUrl}>
              CONFIRMAR CAMBIO
            </Button>
          </Section>
          <Text style={footer}>
            Si no pediste este cambio, asegurá tu cuenta cambiando tu contraseña.
          </Text>
        </Section>
        <Text style={signature}>— El equipo de Vireon Fit</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', padding: '20px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const header = { textAlign: 'center' as const, padding: '24px 0' }
const brand = { fontSize: '24px', fontWeight: 'bold' as const, letterSpacing: '4px', color: '#39FF14', margin: 0 }
const card = { backgroundColor: '#0F0F1A', borderRadius: '16px', padding: '32px 28px', border: '1px solid #8B5CF6' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#ffffff', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#CBD5E1', lineHeight: '1.6', margin: '0 0 18px' }
const highlight = { color: '#39FF14' }
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
