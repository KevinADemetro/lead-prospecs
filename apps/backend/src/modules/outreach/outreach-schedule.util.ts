import {
  OUTREACH_FOLLOW_UP_DAYS,
  OUTREACH_NO_REPLY_GRACE_DAYS,
  type OutreachMessageStep,
} from '@app/shared';

/** Normalize to UTC midnight for calendar-day comparisons. */
export function utcDayStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addUtcDays(date: Date, days: number): Date {
  const result = utcDayStart(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function utcDayRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = utcDayStart(date);
  const end = addUtcDays(start, 1);
  return { start, end };
}

const NEXT_FOLLOW_UP_AFTER_STEP: Record<
  OutreachMessageStep,
  { days: number } | null
> = {
  INITIAL: { days: OUTREACH_FOLLOW_UP_DAYS.FOLLOW_UP_D3 },
  FOLLOW_UP_D3: { days: OUTREACH_FOLLOW_UP_DAYS.FOLLOW_UP_D7 },
  FOLLOW_UP_D7: { days: OUTREACH_FOLLOW_UP_DAYS.FOLLOW_UP_D14 },
  FOLLOW_UP_D14: null,
};

const STEP_ORDER: OutreachMessageStep[] = [
  'INITIAL',
  'FOLLOW_UP_D3',
  'FOLLOW_UP_D7',
  'FOLLOW_UP_D14',
];

/** Next scheduled follow-up after the given step, relative to D0. */
export function nextFollowUpAtAfterStep(
  startedAt: Date,
  step: OutreachMessageStep,
): Date | null {
  const next = NEXT_FOLLOW_UP_AFTER_STEP[step];
  if (!next) {
    return null;
  }
  return addUtcDays(startedAt, next.days);
}

/**
 * Recalculate nextFollowUpAt for WAITING_REPLY based on steps already sent.
 * Returns null when the full sequence is done.
 */
export function recalculateNextFollowUpAt(
  startedAt: Date,
  sentSteps: Iterable<OutreachMessageStep>,
): Date | null {
  const sent = new Set(sentSteps);
  for (const step of STEP_ORDER) {
    if (!sent.has(step)) {
      if (step === 'INITIAL') {
        return nextFollowUpAtAfterStep(startedAt, 'INITIAL');
      }
      // Missing a follow-up step: schedule that step's offset from D0.
      if (step === 'FOLLOW_UP_D3') {
        return addUtcDays(startedAt, OUTREACH_FOLLOW_UP_DAYS.FOLLOW_UP_D3);
      }
      if (step === 'FOLLOW_UP_D7') {
        return addUtcDays(startedAt, OUTREACH_FOLLOW_UP_DAYS.FOLLOW_UP_D7);
      }
      return addUtcDays(startedAt, OUTREACH_FOLLOW_UP_DAYS.FOLLOW_UP_D14);
    }
  }
  // All steps sent — no automatic follow-up remains.
  return null;
}

/** Eligible for bulk NO_REPLY when still waiting and today >= D0 + 14 + 7. */
export function isEligibleForNoReply(startedAt: Date, today: Date = new Date()): boolean {
  const threshold = addUtcDays(
    startedAt,
    OUTREACH_FOLLOW_UP_DAYS.FOLLOW_UP_D14 + OUTREACH_NO_REPLY_GRACE_DAYS,
  );
  return utcDayStart(today).getTime() >= threshold.getTime();
}

export function noReplyThresholdDate(today: Date = new Date()): Date {
  return addUtcDays(
    today,
    -(OUTREACH_FOLLOW_UP_DAYS.FOLLOW_UP_D14 + OUTREACH_NO_REPLY_GRACE_DAYS),
  );
}
