export { Button, AnimatedButton, type ButtonVariant, type ButtonSize, type ButtonStatus } from './Button';
export { Card } from './Card';
export { AnimatedCard } from './animations/AnimatedCard';
export { Input } from './Input';
export { Select } from './Select';
export { Badge, type BadgeTone } from './Badge';
export { EmptyState, SuccessState, ErrorState, OfflineBanner, EmptyStatePreset, emptyPresets } from './EmptyState';
export type { EmptyPresetKey } from './EmptyState';
export { Skeleton, Loading } from './Skeleton';
export { Spinner } from './loading/Spinner';
export { ProgressBar } from './loading/ProgressBar';
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
  MovvoDataGrid,
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
  movvoColorsLegacy,
  movvoColorsLegacyLight,
  movvoSpacing,
  space,
  movvoTypography,
  movvoRadius,
  movvoShadows,
  movvoShadowsLight,
  movvoIcons,
  getMovvoIcon,
} from '../theme';

export type { MovvoIconName, MovvoColorPalette, MovvoSpacing, MovvoTypographyKey } from '../theme';

export const chartColors = {
  revenue: '#22C55E',
  expense: '#EF4444',
  checkins: '#D90429',
  finance: '#EF4444',
  workouts: '#F4D35E',
  wellhub: '#3B82F6',
  totalPass: '#F97316',
  goal: '#D4AF37',
} as const;
