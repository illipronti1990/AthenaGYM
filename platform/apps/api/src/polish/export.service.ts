import { Injectable, BadRequestException, StreamableFile } from '@nestjs/common';
import type { AuthContext } from '@movvo/shared';
import ExcelJS from 'exceljs';
import { buildPdf } from '../prints/pdf.util';
import { SupabaseService } from '../supabase/supabase.service';

const DEV_COMPANY = '11111111-1111-1111-1111-111111111111';

@Injectable()
export class ExportService {
  constructor(private readonly supabase: SupabaseService) {}

  private companyId(auth: AuthContext): string {
    if (auth.isSuperAdmin) return auth.companyId || auth.companyIds[0] || DEV_COMPANY;
    const id = auth.companyId || auth.companyIds[0];
    if (!id) throw new BadRequestException('companyId required');
    return id;
  }

  private toCsv(headers: string[], rows: (string | number)[][]): string {
    const esc = (v: string | number) => {
      const s = String(v ?? '');
      if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    return [headers.map(esc).join(';'), ...rows.map((r) => r.map(esc).join(';'))].join('\n');
  }

  private async toXlsx(sheetName: string, headers: string[], rows: (string | number)[][]) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(sheetName);
    ws.addRow(headers);
    rows.forEach((r) => ws.addRow(r));
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async exportStudents(auth: AuthContext, format: 'csv' | 'xlsx' | 'pdf') {
    const companyId = this.companyId(auth);
    const { data, error } = await this.supabase
      .getAdmin()
      .from('students')
      .select('registration_number, full_name, cpf, email, phone, status, plan_name')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('full_name')
      .limit(5000);
    if (error) throw new BadRequestException(error.message);
    const headers = ['Matrícula', 'Nome', 'CPF', 'E-mail', 'Telefone', 'Status', 'Plano'];
    const rows = (data || []).map((s) => [
      s.registration_number,
      s.full_name,
      s.cpf || '',
      s.email || '',
      s.phone || '',
      s.status,
      s.plan_name || '',
    ]);
    return this.respond('alunos', headers, rows, format);
  }

  async exportReceivables(auth: AuthContext, format: 'csv' | 'xlsx' | 'pdf') {
    const companyId = this.companyId(auth);
    const { data, error } = await this.supabase
      .getAdmin()
      .from('receivables')
      .select('description, amount, due_date, status, paid_at')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('due_date', { ascending: false })
      .limit(5000);
    if (error) throw new BadRequestException(error.message);
    const headers = ['Descrição', 'Valor', 'Vencimento', 'Status', 'Pago em'];
    const rows = (data || []).map((r) => [
      r.description,
      Number(r.amount),
      r.due_date,
      r.status,
      r.paid_at || '',
    ]);
    return this.respond('recebiveis', headers, rows, format);
  }

  async exportCheckins(auth: AuthContext, format: 'csv' | 'xlsx' | 'pdf') {
    const companyId = this.companyId(auth);
    const { data, error } = await this.supabase
      .getAdmin()
      .from('checkins')
      .select('created_at, method, direction, students(full_name, registration_number)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error) throw new BadRequestException(error.message);
    const headers = ['Data', 'Aluno', 'Matrícula', 'Método', 'Direção'];
    const rows = (data || []).map((c) => {
      const st = c.students as { full_name?: string; registration_number?: string } | null;
      return [
        c.created_at,
        st?.full_name || '',
        st?.registration_number || '',
        c.method,
        c.direction,
      ];
    });
    return this.respond('checkins', headers, rows, format);
  }

  private async respond(
    name: string,
    headers: string[],
    rows: (string | number)[][],
    format: 'csv' | 'xlsx' | 'pdf',
  ) {
    if (format === 'csv') {
      const csv = '\uFEFF' + this.toCsv(headers, rows);
      return new StreamableFile(Buffer.from(csv, 'utf8'), {
        type: 'text/csv; charset=utf-8',
        disposition: `attachment; filename="${name}.csv"`,
      });
    }
    if (format === 'xlsx') {
      const buf = await this.toXlsx(name, headers, rows);
      return new StreamableFile(buf, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition: `attachment; filename="${name}.xlsx"`,
      });
    }
    const lines = [
      headers.join(' | '),
      ...rows.slice(0, 80).map((r) => r.join(' | ')),
      rows.length > 80 ? `… +${rows.length - 80} linhas` : '',
    ];
    const pdf = await buildPdf({
      title: `Exportação — ${name}`,
      subtitle: `Movvo · ${rows.length} registros`,
      lines,
    });
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="${name}.pdf"`,
    });
  }
}
