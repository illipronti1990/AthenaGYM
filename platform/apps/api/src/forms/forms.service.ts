import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthContext, CepLookupResult, CpfLookupResult } from '@athena/shared';
import { isValidCpf, normalizeCpf } from '@athena/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { FormsRepository } from './forms.repository';

const DEV_COMPANY = '00000000-0000-4000-8000-000000000001';

@Injectable()
export class FormsService {
  constructor(
    private readonly repo: FormsRepository,
    private readonly supabase: SupabaseService,
  ) {}

  private companyId(auth: AuthContext) {
    const id = auth.companyId || auth.companyIds[0] || (process.env.DEV_AUTH_ENABLED === 'true' ? DEV_COMPANY : null);
    if (!id) throw new BadRequestException('companyId required');
    return id;
  }

  async lookupCep(cep: string): Promise<CepLookupResult> {
    const digits = String(cep || '').replace(/\D/g, '');
    if (digits.length !== 8) throw new BadRequestException('CEP deve ter 8 dígitos');

    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new BadRequestException('Falha ao consultar o CEP');
    const data = (await res.json()) as {
      erro?: boolean | string;
      cep?: string;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };
    if (data.erro) throw new NotFoundException('CEP não encontrado');

    const zip = (data.cep || digits).replace(/\D/g, '');
    return {
      zipcode: `${zip.slice(0, 5)}-${zip.slice(5)}`,
      street: data.logradouro || '',
      district: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    };
  }

  async lookupCpf(auth: AuthContext, cpf: string): Promise<CpfLookupResult> {
    const digits = normalizeCpf(cpf);
    const valid = isValidCpf(digits);
    if (!valid) return { valid: false, exists: false, student: null };

    const row = await this.repo.findStudentByCpf(this.companyId(auth), digits);
    if (!row) return { valid: true, exists: false, student: null };
    return {
      valid: true,
      exists: true,
      student: {
        id: row.id,
        fullName: row.full_name,
        status: row.status,
        registrationNumber: row.registration_number,
      },
    };
  }

  autosave(
    auth: AuthContext,
    body: { formKey: string; entityId?: string | null; payload: Record<string, unknown> },
  ) {
    if (!body.formKey?.trim()) throw new BadRequestException('formKey obrigatório');
    return this.repo.upsertDraft({
      companyId: this.companyId(auth),
      userId: auth.userId,
      formKey: body.formKey.trim(),
      entityId: body.entityId,
      payload: body.payload || {},
    });
  }

  getDraft(auth: AuthContext, formKey: string, entityId?: string) {
    return this.repo.getDraft(this.companyId(auth), auth.userId, formKey, entityId || null);
  }

  listTemplates(auth: AuthContext, kind?: string) {
    return this.repo.listTemplates(this.companyId(auth), kind);
  }

  createTemplate(
    auth: AuthContext,
    body: { kind: string; name: string; payload: Record<string, unknown> },
  ) {
    if (!body.name?.trim()) throw new BadRequestException('name obrigatório');
    return this.repo.createTemplate({
      companyId: this.companyId(auth),
      kind: body.kind || 'other',
      name: body.name.trim(),
      payload: body.payload || {},
    });
  }

  async upload(auth: AuthContext, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    const companyId = this.companyId(auth);
    const admin = this.supabase.getAdmin();
    const safe = file.originalname.replace(/[^\w.\-]+/g, '_');
    const path = `companies/${companyId}/forms/${Date.now()}-${safe}`;
    const { error } = await admin.storage
      .from('contracts')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new BadRequestException(error.message);
    const { data: pub } = admin.storage.from('contracts').getPublicUrl(path);
    return this.repo.insertUpload({
      companyId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storagePath: path,
      publicUrl: pub?.publicUrl || null,
      createdBy: auth.userId,
    });
  }

  async saveSignature(
    auth: AuthContext,
    body: { dataUrl: string; entityType: string; entityId?: string | null },
  ) {
    if (!body.dataUrl?.startsWith('data:image/')) {
      throw new BadRequestException('Assinatura inválida');
    }
    const companyId = this.companyId(auth);
    const base64 = body.dataUrl.split(',')[1];
    if (!base64) throw new BadRequestException('Assinatura inválida');
    const buffer = Buffer.from(base64, 'base64');
    const path = `companies/${companyId}/signatures/${Date.now()}.png`;
    const admin = this.supabase.getAdmin();
    const { error } = await admin.storage
      .from('contracts')
      .upload(path, buffer, { contentType: 'image/png', upsert: false });
    if (error) throw new BadRequestException(error.message);
    const { data: pub } = admin.storage.from('contracts').getPublicUrl(path);
    return this.repo.insertSignature({
      companyId,
      entityType: body.entityType || 'generic',
      entityId: body.entityId,
      storagePath: path,
      publicUrl: pub?.publicUrl || null,
      createdBy: auth.userId,
    });
  }
}
