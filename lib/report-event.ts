import { supabase } from '@/lib/supabase';

export const REPORT_REASONS = [
  'Spam or misleading',
  'Inappropriate content',
  'Wrong location or time',
  'Other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReportEventResult = {
  error: string | null;
  hidden: boolean;
  alreadyReported: boolean;
};

/**
 * Submit a report for a published event. Server sets `is_hidden` pending review.
 * Requires signed-in session + applied `event_reports` migration.
 */
export async function reportEvent(
  eventId: string,
  reason: string,
  details?: string
): Promise<ReportEventResult> {
  if (!supabase) {
    return {
      error: 'Supabase is not configured. Add keys to .env.',
      hidden: false,
      alreadyReported: false,
    };
  }

  const trimmed = reason.trim();
  if (!trimmed) {
    return {
      error: 'Choose a reason for this report.',
      hidden: false,
      alreadyReported: false,
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return {
      error: 'Sign in from Profile to report a listing.',
      hidden: false,
      alreadyReported: false,
    };
  }

  const { data, error } = await supabase.rpc('report_event', {
    p_event_id: eventId,
    p_reason: trimmed,
    p_details: details?.trim() || null,
  });

  if (error) {
    return {
      error: error.message,
      hidden: false,
      alreadyReported: false,
    };
  }

  const payload = data as {
    ok?: boolean;
    hidden?: boolean;
    already_reported?: boolean;
  } | null;

  return {
    error: null,
    hidden: Boolean(payload?.hidden ?? true),
    alreadyReported: Boolean(payload?.already_reported),
  };
}
