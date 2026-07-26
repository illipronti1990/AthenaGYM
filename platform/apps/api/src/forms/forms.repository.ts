import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FormsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  async findStudentByCpf(companyId: string, cpf: string) {
    const { data } = await this.admin()
      .from('students')
      .select('id, full_name, status, registration_number')
      .eq('company_id', companyId)
      .eq('cpf', cpf)
      .is('deleted_at', null)
      .maybeSingle();
    return data as {
      id: string;
      full_name: string;
      status: string;
      registration_number: string | null;
    } | null;
  }

  async upsertDraft(row: {
    companyId: string;
    userId: string;
    formKey: string;
    entityId?: string | null;
    payload: Record<string, unknown>;
  }) {
    const { data, error } = await this.admin()
      .from('form_drafts')
      .upsert(
        {
          company_id: row.companyId,
          user_id: row.userId,
          form_key: row.formKey,
          entity_id: row.entityId || null,
          payload: row.payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'company_id,user_id,form_key,entity_id' },
      )
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getDraft(companyId: string, userId: string, formKey: string, entityId?: string | null) {
    let q = this.admin()
      .from('form_drafts')
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('form_key', formKey);
    if (entityId) q = q.eq('entity_id', entityId);
    else q = q.is('entity_id', null);
    const { data } = await q.maybeSingle();
    return data;
  }

  async listTemplates(companyId: string, kind?: string) {
    let q = this.admin()
      .from('form_templates')
      .select('*')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false });
    if (kind) q = q.eq('kind', kind);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async createTemplate(row: {
    companyId: string;
    kind: string;
    name: string;
    payload: Record<string, unknown>;
  }) {
    const { data, error } = await this.admin()
      .from('form_templates')
      .insert({
        company_id: row.companyId,
        kind: row.kind,
        name: row.name,
        payload: row.payload,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async insertUpload(row: {
    companyId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    storagePath: string;
    publicUrl: string | null;
    createdBy?: string | null;
  }) {
    const { data, error } = await this.admin()
      .from('form_uploads')
      .insert({
        company_id: row.companyId,
        file_name: row.fileName,
        mime_type: row.mimeType,
        size_bytes: row.sizeBytes,
        storage_path: row.storagePath,
        public_url: row.publicUrl,
        created_by: row.createdBy || null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async insertSignature(row: {
    companyId: string;
    entityType: string;
    entityId?: string | null;
    storagePath: string;
    publicUrl: string | null;
    createdBy?: string | null;
  }) {
    const { data, error } = await this.admin()
      .from('form_signatures')
      .insert({
        company_id: row.companyId,
        entity_type: row.entityType,
        entity_id: row.entityId || null,
        storage_path: row.storagePath,
        public_url: row.publicUrl,
        created_by: row.createdBy || null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }
}
