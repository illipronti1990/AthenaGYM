export type EmployeeStatus = 'active' | 'inactive' | 'vacation' | 'leave';
export type ScheduleKind = 'work' | 'off' | 'swap' | 'vacation' | 'training';
export type AssetStatus = 'active' | 'maintenance' | 'retired' | 'lost';
export type MaintenanceKind = 'preventive' | 'corrective';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'open' | 'in_progress' | 'done' | 'cancelled';
export type IncidentType = 'complaint' | 'incident' | 'accident' | 'damaged_equipment' | 'operational';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';
export type AnnouncementAudience = 'all' | 'trainers' | 'reception' | 'managers';
export type CostCenterCategory =
  | 'rh'
  | 'equipamentos'
  | 'manutencao'
  | 'limpeza'
  | 'marketing'
  | 'administrativo'
  | 'outro';

export interface Department {
  id: string;
  companyId: string;
  name: string;
  active: boolean;
}

export interface HrJobTitle {
  id: string;
  companyId: string;
  name: string;
  departmentId: string | null;
  active: boolean;
}

export interface Employee {
  id: string;
  companyId: string;
  unitId: string | null;
  profileId: string | null;
  departmentId: string | null;
  jobTitleId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  documentCpf: string | null;
  photoUrl: string | null;
  hiredAt: string | null;
  status: EmployeeStatus;
  emergencyContacts: unknown[];
  documents: unknown[];
  notes: string | null;
  hourBankBalance: number;
  vacationStart: string | null;
  vacationEnd: string | null;
  createdAt: string;
}

export interface WorkSchedule {
  id: string;
  companyId: string;
  employeeId: string;
  scheduleDate: string;
  shiftStart: string | null;
  shiftEnd: string | null;
  kind: ScheduleKind;
  notes: string | null;
}

export interface AssetCategory {
  id: string;
  companyId: string;
  name: string;
  active: boolean;
}

export interface Asset {
  id: string;
  companyId: string;
  unitId: string | null;
  categoryId: string | null;
  code: string;
  name: string;
  location: string | null;
  purchaseValue: number;
  purchasedAt: string | null;
  warrantyUntil: string | null;
  usefulLifeMonths: number | null;
  status: AssetStatus;
  notes: string | null;
}

export interface MaintenanceOrder {
  id: string;
  companyId: string;
  assetId: string | null;
  assigneeEmployeeId: string | null;
  title: string;
  kind: MaintenanceKind;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  cost: number;
  dueAt: string | null;
  completedAt: string | null;
  photoUrls: string[];
  notes: string | null;
  createdAt: string;
}

export interface CompanyDocument {
  id: string;
  companyId: string;
  categoryId: string | null;
  title: string;
  fileUrl: string | null;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface DocumentCategory {
  id: string;
  companyId: string;
  name: string;
  active: boolean;
}

export interface InternalIncident {
  id: string;
  companyId: string;
  unitId: string | null;
  type: IncidentType;
  title: string;
  description: string | null;
  status: IncidentStatus;
  attachmentUrls: string[];
  createdAt: string;
}

export interface InternalAnnouncement {
  id: string;
  companyId: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  publishedAt: string;
  expiresAt: string | null;
}

export interface AdminDashboardKpis {
  employeesActive: number;
  employeesVacationSoon: number;
  birthdaysThisMonth: number;
  recentHires: number;
  assetsInMaintenance: number;
  openMaintenanceOrders: number;
  documentsExpiringSoon: number;
  maintenanceCostMonth: number;
  incidentsThisMonth: number;
}

export interface AdminCalendarEvent {
  id: string;
  type: 'vacation' | 'maintenance' | 'document' | 'announcement' | 'schedule';
  title: string;
  date: string;
  href?: string;
}
