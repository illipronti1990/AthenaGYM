export const PAYMENT_CREATED = 'finance.payment_created';
export const PAYMENT_CONFIRMED = 'finance.payment_confirmed';
export const SUBSCRIPTION_CREATED = 'finance.subscription_created';
export const SUBSCRIPTION_RENEWED = 'finance.subscription_renewed';

export type PaymentConfirmedEvent = {
  companyId: string;
  receivableId: string;
  transactionId: string;
  studentId: string | null;
  subscriptionId: string | null;
  amount: number;
  paidAt: string;
};

export type SubscriptionCreatedEvent = {
  companyId: string;
  subscriptionId: string;
  studentId: string;
  planId: string;
  contractId: string | null;
};
