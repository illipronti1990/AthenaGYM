export const WAREHOUSE_SYNCED = 'analytics.warehouse.synced';
export const REPORT_CREATED = 'analytics.report.created';
export const EXPORT_REQUESTED = 'analytics.export.requested';
export const PREDICTIONS_RUN = 'analytics.predictions.run';
export const REPORT_SCHEDULED = 'analytics.report.scheduled';

export type WarehouseSyncedEvent = {
  companyId: string;
  facts: string[];
};

export type ExportRequestedEvent = {
  companyId: string;
  exportId: string;
  format: string;
};

export type PredictionsRunEvent = {
  companyId: string;
  type: string;
  count: number;
};
