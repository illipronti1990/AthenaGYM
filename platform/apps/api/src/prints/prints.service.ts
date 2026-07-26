import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import type { AuthContext } from '@athena/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { SettingsService } from '../settings/settings.service';
import { buildPdf } from './pdf.util';

@Injectable()
export class PrintsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly settings: SettingsService,
  ) {}

  private assertCompany(auth: AuthContext, companyId: string) {
    if (!auth.isSuperAdmin && !auth.companyIds.includes(companyId)) {
      throw new NotFoundException('Not found');
    }
  }

  private async gymName(auth: AuthContext) {
    const { settings } = await this.settings.getSettings(auth);
    return settings;
  }

  private asPdf(buffer: Buffer, filename: string) {
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `inline; filename="${filename}"`,
    });
  }

  async contract(auth: AuthContext, enrollmentId: string) {
    const admin = this.supabase.getAdmin();
    const { data: enrollment, error } = await admin
      .from('enrollments')
      .select('*, students(full_name, cpf, email), plans(name, price), contracts(contract_number, status)')
      .eq('id', enrollmentId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!enrollment) throw new NotFoundException('Matrícula não encontrada');
    this.assertCompany(auth, enrollment.company_id);

    const gym = await this.gymName(auth);
    const student = enrollment.students as { full_name?: string; cpf?: string; email?: string } | null;
    const plan = enrollment.plans as { name?: string; price?: number } | null;
    const contract = enrollment.contracts as { contract_number?: string; status?: string } | null;

    const pdf = await buildPdf({
      title: 'Contrato de Matrícula',
      subtitle: gym.name,
      footer: gym.receiptFooter,
      lines: [
        { text: `CNPJ: ${gym.cnpj || '—'}`, size: 10 },
        '',
        { text: 'Aluno', bold: true },
        `Nome: ${student?.full_name || '—'}`,
        `CPF: ${student?.cpf || '—'}`,
        `E-mail: ${student?.email || '—'}`,
        '',
        { text: 'Plano', bold: true },
        `Nome: ${plan?.name || '—'}`,
        `Valor: R$ ${Number(plan?.price || 0).toFixed(2)}`,
        `Início: ${enrollment.start_date}`,
        `Fim: ${enrollment.end_date || '—'}`,
        `Contrato nº: ${contract?.contract_number || '—'}`,
        `Status: ${enrollment.status}`,
        '',
        'O aluno declara estar ciente das regras da academia e das condições de pagamento.',
      ],
    });

    return this.asPdf(pdf, `contrato-${enrollmentId}.pdf`);
  }

  async receipt(auth: AuthContext, paymentId: string) {
    const admin = this.supabase.getAdmin();
    const { data: tx, error } = await admin
      .from('payment_transactions')
      .select('*, receivables(description, amount, student_id, students(full_name))')
      .eq('id', paymentId)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!tx) throw new NotFoundException('Pagamento não encontrado');
    this.assertCompany(auth, tx.company_id);

    const gym = await this.gymName(auth);
    const receivable = tx.receivables as {
      description?: string;
      amount?: number;
      students?: { full_name?: string } | null;
    } | null;

    const pdf = await buildPdf({
      title: 'Recibo de Pagamento',
      subtitle: gym.name,
      footer: gym.receiptFooter,
      lines: [
        { text: `CNPJ: ${gym.cnpj || '—'}`, size: 10 },
        '',
        `Aluno: ${receivable?.students?.full_name || '—'}`,
        `Descrição: ${receivable?.description || 'Pagamento'}`,
        `Valor: R$ ${Number(tx.amount).toFixed(2)}`,
        `Status: ${tx.status}`,
        `Pago em: ${tx.paid_at || '—'}`,
        `Gateway: ${tx.gateway}`,
        `ID: ${tx.id}`,
      ],
    });

    return this.asPdf(pdf, `recibo-${paymentId}.pdf`);
  }

  async declaration(auth: AuthContext, studentId: string) {
    const admin = this.supabase.getAdmin();
    const { data: student, error } = await admin
      .from('students')
      .select('*')
      .eq('id', studentId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!student) throw new NotFoundException('Aluno não encontrado');
    this.assertCompany(auth, student.company_id);

    const gym = await this.gymName(auth);
    const today = new Date().toLocaleDateString('pt-BR');

    const pdf = await buildPdf({
      title: 'Declaração de Vínculo',
      subtitle: gym.name,
      footer: gym.receiptFooter,
      lines: [
        { text: `CNPJ: ${gym.cnpj || '—'}`, size: 10 },
        '',
        `Declaramos para os devidos fins que ${student.full_name},`,
        `matrícula ${student.registration_number}, CPF ${student.cpf || '—'},`,
        `é aluno(a) desta academia com status ${student.status}.`,
        '',
        `Emitido em ${today}.`,
        '',
        '________________________________',
        gym.name,
      ],
    });

    return this.asPdf(pdf, `declaracao-${studentId}.pdf`);
  }

  async assessment(auth: AuthContext, assessmentId: string) {
    const admin = this.supabase.getAdmin();
    const { data: row, error } = await admin
      .from('assessments')
      .select('*, students(full_name, registration_number)')
      .eq('id', assessmentId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!row) throw new NotFoundException('Avaliação não encontrada');
    this.assertCompany(auth, row.company_id);

    const gym = await this.gymName(auth);
    const student = row.students as { full_name?: string; registration_number?: string } | null;

    const pdf = await buildPdf({
      title: 'Avaliação Física',
      subtitle: gym.name,
      footer: gym.receiptFooter,
      lines: [
        `Aluno: ${student?.full_name || '—'} (${student?.registration_number || '—'})`,
        `Data: ${new Date(row.created_at).toLocaleDateString('pt-BR')}`,
        '',
        { text: 'Medidas', bold: true },
        `Peso: ${row.weight ?? '—'} kg`,
        `Altura: ${row.height ?? '—'} m`,
        `% Gordura: ${row.body_fat ?? '—'}`,
        `Massa magra: ${row.lean_mass ?? '—'}`,
        `IMC: ${row.bmi ?? '—'}`,
        `TMB: ${row.bmr ?? '—'}`,
        `Gordura visceral: ${row.visceral_fat ?? '—'}`,
        `Idade metabólica: ${row.metabolic_age ?? '—'}`,
        `Objetivo: ${row.objective || '—'}`,
        '',
        { text: 'Observações', bold: true },
        row.observations || '—',
      ],
    });

    return this.asPdf(pdf, `avaliacao-${assessmentId}.pdf`);
  }

  async studentSheet(auth: AuthContext, studentId: string) {
    const admin = this.supabase.getAdmin();
    const { data: student, error } = await admin
      .from('students')
      .select('*')
      .eq('id', studentId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!student) throw new NotFoundException('Aluno não encontrado');
    this.assertCompany(auth, student.company_id);

    const gym = await this.gymName(auth);
    const { data: enrollments } = await admin
      .from('enrollments')
      .select('status, start_date, end_date, plans(name)')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .limit(5);

    const planLines = (enrollments || []).map((e) => {
      const plan = e.plans as { name?: string } | null;
      return `- ${plan?.name || 'Plano'} (${e.status}) ${e.start_date} → ${e.end_date || '—'}`;
    });

    const pdf = await buildPdf({
      title: 'Ficha do Aluno',
      subtitle: gym.name,
      footer: gym.receiptFooter,
      lines: [
        { text: 'Dados', bold: true },
        `Nome: ${student.full_name}`,
        `Matrícula: ${student.registration_number}`,
        `CPF: ${student.cpf || '—'}`,
        `E-mail: ${student.email || '—'}`,
        `Telefone: ${student.phone || '—'}`,
        `WhatsApp: ${student.whatsapp || '—'}`,
        `Status: ${student.status}`,
        `Plano: ${student.plan_name || '—'}`,
        `Professor: ${student.trainer_name || '—'}`,
        '',
        { text: 'Matrículas', bold: true },
        ...(planLines.length ? planLines : ['—']),
        '',
        { text: 'Observações', bold: true },
        student.notes || '—',
      ],
    });

    return this.asPdf(pdf, `ficha-${studentId}.pdf`);
  }
}
