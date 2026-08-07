import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export type StorageDomain =
  | 'alunos'
  | 'professores'
  | 'produtos'
  | 'documentos'
  | 'patrimonio'
  | 'branding'
  | 'backups'
  | 'contratos'
  | 'outros';

@Injectable()
export class StorageService {
  constructor(private readonly supabase: SupabaseService) {}

  /** companies/{companyId}/{domain}/... with version stamp */
  path(
    companyId: string,
    domain: StorageDomain,
    filename: string,
    opts?: { version?: string | number },
  ): string {
    const safe = filename.replace(/[^a-zA-Z0-9._/-]/g, '_').replace(/^\//, '');
    const v = opts?.version ?? Date.now();
    return `companies/${companyId}/${domain}/v${v}/${safe}`;
  }

  async createSignedUpload(
    bucket: string,
    path: string,
    expiresIn = 3600,
  ): Promise<{ path: string; token: string; signedUrl: string }> {
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUploadUrl(path);
    if (error) throw new BadRequestException(error.message);
    return {
      path,
      token: data.token,
      signedUrl: data.signedUrl,
    };
  }

  async createSignedDownload(
    bucket: string,
    path: string,
    expiresIn = 3600,
  ): Promise<string> {
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    if (error) throw new BadRequestException(error.message);
    return data.signedUrl;
  }

  async upload(
    bucket: string,
    path: string,
    body: Buffer | Blob | ArrayBuffer | File | FormData | NodeJS.ReadableStream | ArrayBufferView | string,
    contentType: string,
    cacheControl = 'public, max-age=86400',
  ) {
    const admin = this.supabase.getAdmin();
    const { error } = await admin.storage.from(bucket).upload(path, body as Buffer, {
      contentType,
      cacheControl,
      upsert: false,
    });
    if (error) throw new BadRequestException(error.message);
    return { path, bucket };
  }
}
