export type IntegrationStatus = 'available' | 'soon';

export type MarketingIntegration = {
  id: string;
  name: string;
  status: IntegrationStatus;
  blurb: string;
};

export const MARKETING_INTEGRATIONS: MarketingIntegration[] = [
  { id: 'wellhub', name: 'Wellhub', status: 'available', blurb: 'Check-in e elegibilidade.' },
  { id: 'totalpass', name: 'TotalPass', status: 'available', blurb: 'Validação operacional.' },
  { id: 'mercadopago', name: 'Mercado Pago', status: 'available', blurb: 'Cobranças e recorrência.' },
  { id: 'asaas', name: 'Asaas', status: 'available', blurb: 'Boletos e assinaturas.' },
  { id: 'whatsapp', name: 'WhatsApp', status: 'available', blurb: 'Comunicação com alunos.' },
  { id: 'gcal', name: 'Google Calendar', status: 'soon', blurb: 'Sincronização de agenda.' },
  { id: 'omie', name: 'Omie', status: 'soon', blurb: 'Contabilidade e ERP.' },
  { id: 'contaazul', name: 'Conta Azul', status: 'soon', blurb: 'Gestão financeira.' },
  { id: 'controlid', name: 'Control iD', status: 'soon', blurb: 'Controle de acesso.' },
];
