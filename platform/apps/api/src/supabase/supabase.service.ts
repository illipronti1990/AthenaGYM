import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private admin!: SupabaseClient;
  private anon!: SupabaseClient;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('SUPABASE_URL') || '';
    const anonKey = this.config.get<string>('SUPABASE_ANON_KEY') || '';
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!url || !serviceKey) {
      // Allow boot without secrets for lint/build; runtime calls will fail clearly.
      console.warn('[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
    }
    this.admin = createClient(url || 'http://localhost', serviceKey || 'missing', {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.anon = createClient(url || 'http://localhost', anonKey || serviceKey || 'missing', {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  getAdmin(): SupabaseClient {
    return this.admin;
  }

  getAnon(): SupabaseClient {
    return this.anon;
  }
}
