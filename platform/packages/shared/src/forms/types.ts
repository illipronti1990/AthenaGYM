export type FormTemplateKind =
  | 'workout'
  | 'assessment'
  | 'contract'
  | 'charge'
  | 'enrollment'
  | 'other';

export interface FormTemplate {
  id: string;
  companyId: string;
  kind: FormTemplateKind;
  name: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FormDraft {
  id: string;
  companyId: string;
  userId: string;
  formKey: string;
  entityId: string | null;
  payload: Record<string, unknown>;
  updatedAt: string;
}

export interface FormUpload {
  id: string;
  companyId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  publicUrl: string | null;
  createdAt: string;
}

export interface FormSignature {
  id: string;
  companyId: string;
  entityType: string;
  entityId: string | null;
  storagePath: string;
  publicUrl: string | null;
  createdAt: string;
}

export interface CepLookupResult {
  zipcode: string;
  street: string;
  district: string;
  city: string;
  state: string;
}

export interface CpfLookupResult {
  valid: boolean;
  exists: boolean;
  student?: {
    id: string;
    fullName: string;
    status: string;
    registrationNumber: string | null;
  } | null;
}
