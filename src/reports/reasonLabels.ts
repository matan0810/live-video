import type { ReportReason } from '../../shared/reports';

export const REASON_LABELS: Record<ReportReason, string> = {
  'not-working': 'הערוץ לא עובד',
  'new-link': 'יש לי קישור מעודכן',
  'wrong-content': 'משודר משהו אחר',
  other: 'משהו אחר',
};
