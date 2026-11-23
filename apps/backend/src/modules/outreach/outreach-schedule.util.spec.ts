import {
  addUtcDays,
  isEligibleForNoReply,
  nextFollowUpAtAfterStep,
  noReplyThresholdDate,
  recalculateNextFollowUpAt,
  utcDayRange,
  utcDayStart,
} from './outreach-schedule.util';

describe('outreach-schedule.util', () => {
  const d0 = new Date(Date.UTC(2026, 0, 1)); // 2026-01-01

  it('computes D+3 / D+7 / D+14 from D0', () => {
    expect(nextFollowUpAtAfterStep(d0, 'INITIAL')?.toISOString()).toBe(
      '2026-01-04T00:00:00.000Z',
    );
    expect(nextFollowUpAtAfterStep(d0, 'FOLLOW_UP_D3')?.toISOString()).toBe(
      '2026-01-08T00:00:00.000Z',
    );
    expect(nextFollowUpAtAfterStep(d0, 'FOLLOW_UP_D7')?.toISOString()).toBe(
      '2026-01-15T00:00:00.000Z',
    );
    expect(nextFollowUpAtAfterStep(d0, 'FOLLOW_UP_D14')).toBeNull();
  });

  it('recalculates next follow-up from sent steps', () => {
    expect(recalculateNextFollowUpAt(d0, ['INITIAL'])?.toISOString()).toBe(
      '2026-01-04T00:00:00.000Z',
    );
    expect(recalculateNextFollowUpAt(d0, ['INITIAL', 'FOLLOW_UP_D3'])?.toISOString()).toBe(
      '2026-01-08T00:00:00.000Z',
    );
    expect(
      recalculateNextFollowUpAt(d0, ['INITIAL', 'FOLLOW_UP_D3', 'FOLLOW_UP_D7'])?.toISOString(),
    ).toBe('2026-01-15T00:00:00.000Z');
    expect(
      recalculateNextFollowUpAt(d0, [
        'INITIAL',
        'FOLLOW_UP_D3',
        'FOLLOW_UP_D7',
        'FOLLOW_UP_D14',
      ]),
    ).toBeNull();
  });

  it('marks NO_REPLY eligibility at D0 + 21', () => {
    expect(isEligibleForNoReply(d0, new Date(Date.UTC(2026, 0, 21)))).toBe(false);
    expect(isEligibleForNoReply(d0, new Date(Date.UTC(2026, 0, 22)))).toBe(true);
    expect(noReplyThresholdDate(new Date(Date.UTC(2026, 0, 22))).toISOString()).toBe(
      '2026-01-01T00:00:00.000Z',
    );
  });

  it('builds UTC day ranges', () => {
    const { start, end } = utcDayRange(new Date(Date.UTC(2026, 5, 15, 18, 30)));
    expect(start.toISOString()).toBe('2026-06-15T00:00:00.000Z');
    expect(end.toISOString()).toBe('2026-06-16T00:00:00.000Z');
    expect(utcDayStart(addUtcDays(d0, 3)).toISOString()).toBe('2026-01-04T00:00:00.000Z');
  });
});
