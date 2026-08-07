import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AuthContext,
  GlobalSearchHit,
  GlobalSearchResult,
  TimelineEvent,
  UserFavorite,
} from '@movvo/shared';
import { AuthUser } from '../auth/auth.types';
import { SupabaseService } from '../supabase/supabase.service';

const DEV_COMPANY = '11111111-1111-1111-1111-111111111111';

@Injectable()
export class PolishService {
  constructor(private readonly supabase: SupabaseService) {}

  private companyId(auth: AuthContext): string {
    if (auth.isSuperAdmin) {
      return auth.companyId || auth.companyIds[0] || DEV_COMPANY;
    }
    const id = auth.companyId || auth.companyIds[0];
    if (!id) throw new BadRequestException('companyId required');
    return id;
  }

  async search(auth: AuthContext, q: string): Promise<GlobalSearchResult> {
    const query = (q || '').trim();
    if (query.length < 2) {
      throw new BadRequestException('Informe ao menos 2 caracteres');
    }
    const companyId = this.companyId(auth);
    const admin = this.supabase.getAdmin();
    const like = `%${query}%`;
    const hits: GlobalSearchHit[] = [];

    const [students, enrollments, receivables, workouts, assessments, payments] =
      await Promise.all([
        admin
          .from('students')
          .select('id, full_name, registration_number, status')
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .or(`full_name.ilike.${like},registration_number.ilike.${like},cpf.ilike.${like}`)
          .limit(8),
        admin
          .from('enrollments')
          .select('id, status, start_date, students(full_name)')
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .limit(8),
        admin
          .from('receivables')
          .select('id, description, amount, status, students(full_name)')
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .ilike('description', like)
          .limit(8),
        admin
          .from('workouts')
          .select('id, name, status, students(full_name)')
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .ilike('name', like)
          .limit(8),
        admin
          .from('assessments')
          .select('id, objective, created_at, students(full_name)')
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .limit(8),
        admin
          .from('payment_transactions')
          .select('id, amount, status, paid_at')
          .eq('company_id', companyId)
          .limit(8),
      ]);

    for (const s of students.data || []) {
      hits.push({
        type: 'student',
        id: s.id,
        title: s.full_name,
        subtitle: `${s.registration_number} · ${s.status}`,
        href: `/app/alunos/${s.id}`,
      });
    }

    const qLower = query.toLowerCase();
    for (const e of enrollments.data || []) {
      const student = e.students as { full_name?: string } | null;
      const title = `Matrícula — ${student?.full_name || e.id.slice(0, 8)}`;
      if (!title.toLowerCase().includes(qLower) && !String(e.status).includes(qLower)) continue;
      hits.push({
        type: 'enrollment',
        id: e.id,
        title,
        subtitle: `${e.status} · ${e.start_date}`,
        href: `/app/sales`,
      });
    }

    for (const r of receivables.data || []) {
      const student = r.students as { full_name?: string } | null;
      hits.push({
        type: 'receivable',
        id: r.id,
        title: r.description,
        subtitle: `${student?.full_name || '—'} · R$ ${Number(r.amount).toFixed(2)} · ${r.status}`,
        href: `/app/finance`,
      });
    }

    for (const w of workouts.data || []) {
      const student = w.students as { full_name?: string } | null;
      hits.push({
        type: 'workout',
        id: w.id,
        title: w.name,
        subtitle: `${student?.full_name || '—'} · ${w.status}`,
        href: `/app/workouts`,
      });
    }

    for (const a of assessments.data || []) {
      const student = a.students as { full_name?: string } | null;
      const name = student?.full_name || '';
      if (query.length >= 2 && name && !name.toLowerCase().includes(qLower) && !(a.objective || '').toLowerCase().includes(qLower)) {
        continue;
      }
      hits.push({
        type: 'assessment',
        id: a.id,
        title: `Avaliação — ${name || a.id.slice(0, 8)}`,
        subtitle: a.objective || new Date(a.created_at).toLocaleDateString('pt-BR'),
        href: `/app/workouts`,
      });
    }

    for (const p of payments.data || []) {
      const idShort = String(p.id);
      if (!idShort.includes(query) && !String(p.status).includes(qLower)) continue;
      hits.push({
        type: 'payment',
        id: p.id,
        title: `Pagamento R$ ${Number(p.amount).toFixed(2)}`,
        subtitle: `${p.status} · ${p.paid_at || '—'}`,
        href: `/app/finance`,
      });
    }

    const safe = async <T,>(p: PromiseLike<{ data: T[] | null; error: unknown }>) => {
      try {
        const r = await p;
        if (r.error) return [] as T[];
        return (r.data || []) as T[];
      } catch {
        return [] as T[];
      }
    };

    const [planRows, productRows, trainerRows, sessionRows] = await Promise.all([
      safe(
        admin
          .from('plans')
          .select('id, name, plan_type, price, active')
          .eq('company_id', companyId)
          .ilike('name', like)
          .limit(6),
      ),
      safe(
        admin
          .from('products')
          .select('id, name, sku, status')
          .eq('company_id', companyId)
          .or(`name.ilike.${like},sku.ilike.${like}`)
          .limit(6),
      ),
      safe(
        admin
          .from('profiles')
          .select('id, full_name, email')
          .eq('company_id', companyId)
          .or(`full_name.ilike.${like},email.ilike.${like}`)
          .limit(6),
      ),
      safe(
        admin
          .from('class_sessions')
          .select('id, title, starts_at, status')
          .eq('company_id', companyId)
          .ilike('title', like)
          .limit(6),
      ),
    ]);

    for (const p of planRows as Array<Record<string, unknown>>) {
      hits.push({
        type: 'plan',
        id: String(p.id),
        title: String(p.name),
        subtitle: `${p.plan_type || 'plano'} · R$ ${Number(p.price || 0).toFixed(2)}`,
        href: `/app/matriculas/planos`,
      });
    }
    for (const p of productRows as Array<Record<string, unknown>>) {
      hits.push({
        type: 'product',
        id: String(p.id),
        title: String(p.name),
        subtitle: `${p.sku || '—'} · ${p.status || 'produto'}`,
        href: `/app/estoque`,
      });
    }
    for (const t of trainerRows as Array<Record<string, unknown>>) {
      hits.push({
        type: 'trainer',
        id: String(t.id),
        title: String(t.full_name || t.email || t.id),
        subtitle: String(t.email || 'Equipe'),
        href: `/app/trainers`,
      });
    }
    for (const s of sessionRows as Array<Record<string, unknown>>) {
      hits.push({
        type: 'class_session',
        id: String(s.id),
        title: String(s.title || 'Aula'),
        subtitle: `${s.status || '—'} · ${s.starts_at || ''}`,
        href: `/app/agenda`,
      });
    }

    if (qLower.includes('config') || qLower.includes('setting') || qLower.includes('preferên')) {
      hits.push({
        type: 'setting',
        id: 'settings',
        title: 'Configurações',
        subtitle: 'Preferências da academia',
        href: '/app/settings',
      });
    }

    return { query, hits: hits.slice(0, 40) };
  }

  async listFavorites(user: AuthUser, auth: AuthContext): Promise<UserFavorite[]> {
    const companyId = this.companyId(auth);
    const { data, error } = await this.supabase
      .getAdmin()
      .from('user_favorites')
      .select('*')
      .eq('profile_id', user.id)
      .eq('company_id', companyId)
      .order('sort_order')
      .order('created_at');
    if (error) throw new BadRequestException(error.message);
    return (data || []).map((r) => ({
      id: r.id,
      profileId: r.profile_id,
      companyId: r.company_id,
      href: r.href,
      label: r.label,
      sortOrder: r.sort_order,
      createdAt: r.created_at,
    }));
  }

  async addFavorite(
    user: AuthUser,
    auth: AuthContext,
    body: { href: string; label: string },
  ): Promise<UserFavorite> {
    if (!body.href || !body.label) throw new BadRequestException('href e label obrigatórios');
    const companyId = this.companyId(auth);
    const { data, error } = await this.supabase
      .getAdmin()
      .from('user_favorites')
      .upsert(
        {
          profile_id: user.id,
          company_id: companyId,
          href: body.href,
          label: body.label,
        },
        { onConflict: 'profile_id,company_id,href' },
      )
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    return {
      id: data.id,
      profileId: data.profile_id,
      companyId: data.company_id,
      href: data.href,
      label: data.label,
      sortOrder: data.sort_order,
      createdAt: data.created_at,
    };
  }

  async removeFavorite(user: AuthUser, auth: AuthContext, id: string): Promise<void> {
    const companyId = this.companyId(auth);
    const { error } = await this.supabase
      .getAdmin()
      .from('user_favorites')
      .delete()
      .eq('id', id)
      .eq('profile_id', user.id)
      .eq('company_id', companyId);
    if (error) throw new BadRequestException(error.message);
  }

  async timeline(auth: AuthContext, entity: string, id: string): Promise<TimelineEvent[]> {
    const companyId = this.companyId(auth);
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('audit_logs')
      .select('*')
      .eq('company_id', companyId)
      .eq('entity', entity)
      .eq('entity_id', id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new BadRequestException(error.message);

    if ((!data || data.length === 0) && entity === 'student') {
      const { data: hist } = await admin
        .from('student_status_history')
        .select('*')
        .eq('student_id', id)
        .order('created_at', { ascending: false })
        .limit(50);
      return (hist || []).map((h) => ({
        id: h.id,
        module: 'students',
        action: `status:${h.new_status}`,
        entity: 'student',
        entityId: id,
        metadata: {
          oldStatus: h.old_status,
          newStatus: h.new_status,
          reason: h.reason,
        },
        createdAt: h.created_at,
        userId: h.created_by || null,
      }));
    }

    if (!data) throw new NotFoundException('Timeline vazia');

    return data.map((r) => ({
      id: r.id,
      module: r.module,
      action: r.action,
      entity: r.entity,
      entityId: r.entity_id,
      metadata: r.metadata,
      createdAt: r.created_at,
      userId: r.user_id,
    }));
  }
}
