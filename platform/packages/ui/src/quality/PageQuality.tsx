/**
 * PX-7 quality checklist — every production screen should cover these states.
 * Use as documentation + runtime data attributes for audits.
 */
export const PAGE_QUALITY_CHECKLIST = [
  'skeleton',
  'empty',
  'error',
  'loading',
  'responsive',
  'shortcuts',
  'breadcrumb',
  'permissions',
  'performance',
] as const;

export type PageQualityFlag = (typeof PAGE_QUALITY_CHECKLIST)[number];

export function pageQualityAttrs(flags: PageQualityFlag[] = [...PAGE_QUALITY_CHECKLIST]) {
  return {
    'data-page-quality': flags.join(','),
  } as const;
}
