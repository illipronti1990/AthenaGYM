export { Button, AnimatedButton, type ButtonVariant, type ButtonSize, type ButtonStatus } from './Button';
export { Card } from './Card';
export { AnimatedCard } from './animations/AnimatedCard';
export { Input } from './Input';
export { Select } from './Select';
export { Badge, type BadgeTone } from './Badge';
export { EmptyState, SuccessState, ErrorState, OfflineBanner } from './EmptyState';
export { Skeleton, Loading } from './Skeleton';
export {
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonForm,
  SkeletonDashboard,
  SkeletonBlock,
} from './loading/skeletons';
export { Breadcrumb, Avatar } from './misc';
export { Logo } from './Logo';
export { Modal, Dialog } from './Modal';
export { ConfirmDialog } from './dialogs/ConfirmDialog';
export { Navbar } from './Navbar';
export { SidebarNav, type SidebarItem } from './Sidebar';
export { Table, Th, Td } from './Table';
export { ToastProvider, useToast, type ToastTone } from './Toast';
export { Tooltip, TooltipProvider } from './feedback/Tooltip';
export { ProgressIndicator } from './feedback/ProgressIndicator';
export { LoadingOverlay } from './feedback/LoadingOverlay';
export { FloatingActionButton } from './feedback/FloatingActionButton';
export { Page, PageHeader, PageActions, PageFilters, PageContent } from './Page';

export {
  AthenaDataGrid,
  DataGridToolbar,
  DataGridFilters,
  ColumnSelector,
  Pagination,
  BulkActions,
  RowMenu,
  WorkPanels,
  MobileCardView,
  EmptyTable,
  type DataGridColumn,
  type DataGridSort,
  type DataGridFilterDef,
  type DataGridRowAction,
  type DataGridBulkAction,
  type WorkPanel,
  type SavedFilterItem,
  type TablePreferencesState,
} from './datatable';

export {
  Form,
  FormSection,
  FormRow,
  FormActions,
  FormProgress,
  ValidationMessage,
  Textarea,
  Checkbox,
  Switch,
  RadioGroup,
  FormSelect,
  FormInput,
  CpfInput,
  PhoneInput,
  CnpjInput,
  CepInput,
  CurrencyInput,
  DatePicker,
  TimePicker,
  Combobox,
  FileUploader,
  ImageUploader,
  AvatarUpload,
  SignaturePad,
  Wizard,
  StepIndicator,
  AutoSaveIndicator,
  onlyDigits,
  formatCpfMask,
  formatPhoneMask,
  formatCepMask,
  formatCurrencyBRL,
  formatCurrencyInput,
  parseCurrencyInput,
  type UploadItem,
  type WizardStep,
  type FormAutosaveStatus,
} from './forms';

export { ErrorBoundary } from './ErrorBoundary';
export { AccessibilityProvider, useAccessibility, FocusRing } from './accessibility';
export { PageLoader, PerformanceMonitor, type PerfMetric } from './performance';
export { NetworkStatusProvider, useNetworkStatus, ReconnectOverlay } from './network';
export { BottomNavigation, type BottomNavItem } from './mobile';
export { ShortcutDialog, DEFAULT_SHORTCUTS, type ShortcutItem } from './shortcuts';
export { reportClientError, getBufferedErrors, type ClientErrorPayload } from './monitoring';
export { PAGE_QUALITY_CHECKLIST, pageQualityAttrs, type PageQualityFlag } from './quality';

export {
  athenaColors,
  athenaColorsLight,
  athenaSpacing,
  space,
  athenaTypography,
  athenaRadius,
  athenaShadows,
  athenaShadowsLight,
  athenaIcons,
  getAthenaIcon,
} from '../theme';

export type { AthenaIconName, AthenaColorPalette, AthenaSpacing, AthenaTypographyKey } from '../theme';

export const chartColors = {
  revenue: '#D4AF37',
  checkins: '#A00018',
  finance: '#E63946',
  workouts: '#F4D35E',
} as const;
