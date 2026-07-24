import { DateTime, Interval } from "luxon";
import { AvailabilityRule, EventType, TravelWithRules } from "./db";
import { BusyInterval } from "./google";

export type Slot = { startIso: string; endIso: string };

/** The travel schedule covering a calendar date, or null when at home. */
export function travelForDate(
  dateIso: string,
  travel: TravelWithRules[]
): TravelWithRules | null {
  return travel.find((t) => t.start_date <= dateIso && dateIso <= t.end_date) ?? null;
}

/** The scheduling fields of a user row (User satisfies this structurally). */
export type ScheduleConfig = {
  timezone: string;
  min_notice_hours: number;
  booking_window_days: number;
  slot_step_mins: number;
};

/**
 * Compute bookable slots for one calendar day as seen by the visitor.
 *
 * Availability rules are defined in the owner's timezone; the visitor's day
 * may straddle two owner-days, so both neighbouring days are expanded.
 * On dates covered by a travel schedule, the trip's own weekly hours (in the
 * trip's timezone) replace the normal weekly availability entirely.
 */
export function computeSlots(opts: {
  dateIso: string; // "2026-07-21" in the visitor's timezone
  visitorTz: string;
  settings: ScheduleConfig;
  eventType: EventType;
  rules: AvailabilityRule[];
  busy: BusyInterval[];
  travel?: TravelWithRules[];
  now?: DateTime;
}): Slot[] {
  const { settings, eventType, rules, busy } = opts;
  const travel = opts.travel ?? [];
  const now = opts.now ?? DateTime.utc();

  const visitorDayStart = DateTime.fromISO(opts.dateIso, { zone: opts.visitorTz }).startOf("day");
  if (!visitorDayStart.isValid) return [];
  const visitorDay = Interval.fromDateTimes(visitorDayStart, visitorDayStart.plus({ days: 1 }));

  const earliest = now.plus({ hours: settings.min_notice_hours });
  const latest = now.plus({ days: settings.booking_window_days });

  const busyIntervals = busy
    .map((b) => Interval.fromDateTimes(DateTime.fromISO(b.start), DateTime.fromISO(b.end)))
    .filter((i) => i.isValid);

  const step = Math.max(5, settings.slot_step_mins || 30);
  const slots: Slot[] = [];

  // Expand availability windows for owner-days overlapping the visitor's day.
  // Each candidate zone yields its own owner-day; a day only counts in the
  // zone that is actually effective for that calendar date.
  const zones = Array.from(new Set([settings.timezone, ...travel.map((t) => t.timezone)]));
  const expanded = new Set<string>();
  for (const dayOffset of [-1, 0, 1]) {
    for (const zone of zones) {
      const ownerDay = visitorDayStart
        .setZone(zone)
        .plus({ days: dayOffset })
        .startOf("day");
      const ownerDate = ownerDay.toISODate()!;
      const trip = travelForDate(ownerDate, travel);
      if ((trip?.timezone ?? settings.timezone) !== zone) continue;
      if (expanded.has(`${zone}|${ownerDate}`)) continue;
      expanded.add(`${zone}|${ownerDate}`);
      const weekday = ownerDay.weekday - 1; // luxon: 1 = Monday → our 0 = Monday
      const dayRules = trip ? trip.rules : rules;

      for (const rule of dayRules.filter((r) => r.weekday === weekday)) {
        const [sh, sm] = rule.start_time.split(":").map(Number);
        const [eh, em] = rule.end_time.split(":").map(Number);
        const windowStart = ownerDay.set({ hour: sh, minute: sm });
        const windowEnd = ownerDay.set({ hour: eh, minute: em });
        if (windowEnd <= windowStart) continue;

        let cursor = windowStart;
        while (cursor.plus({ minutes: eventType.duration_mins }) <= windowEnd) {
          const slotStart = cursor;
          const slotEnd = cursor.plus({ minutes: eventType.duration_mins });
          cursor = cursor.plus({ minutes: step });

          if (!visitorDay.contains(slotStart.setZone(opts.visitorTz))) continue;
          if (slotStart < earliest || slotStart > latest) continue;

          const padded = Interval.fromDateTimes(
            slotStart.minus({ minutes: eventType.buffer_before }),
            slotEnd.plus({ minutes: eventType.buffer_after })
          );
          if (busyIntervals.some((b) => b.overlaps(padded))) continue;

          slots.push({ startIso: slotStart.toUTC().toISO()!, endIso: slotEnd.toUTC().toISO()! });
        }
      }
    }
  }

  slots.sort((a, b) => a.startIso.localeCompare(b.startIso));
  // De-dupe in case owner-day expansion produced the same slot twice.
  return slots.filter((s, i) => i === 0 || s.startIso !== slots[i - 1].startIso);
}
