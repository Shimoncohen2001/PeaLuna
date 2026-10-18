/** Mirrors createBooking overlap window in technician.service (do not change independently). */
export const SLOT_OVERLAP_MS = 60 * 60 * 1000;
export const SLOT_STEP_MINUTES = 60;

export type AvailabilityWindow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

function parseHm(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function overlapsBooking(candidate: Date, booked: number[], windowMs: number): boolean {
  const t = candidate.getTime();
  return booked.some((bt) => bt >= t - windowMs && bt < t + windowMs);
}

export function availableStartsForMonth(input: {
  year: number;
  month: number;
  availability: AvailabilityWindow[];
  bookedAt: string[];
  now?: Date;
}): Record<string, string[]> {
  const byDow = new Map<number, Array<{ start: number; end: number }>>();
  for (const window of input.availability) {
    const start = parseHm(window.startTime);
    const end = parseHm(window.endTime);
    if (start == null || end == null || end <= start) continue;
    const list = byDow.get(window.dayOfWeek) ?? [];
    list.push({ start, end });
    byDow.set(window.dayOfWeek, list);
  }
  if (byDow.size === 0) return {};

  const booked = input.bookedAt
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));
  const now = (input.now ?? new Date()).getTime();
  const daysInMonth = new Date(input.year, input.month + 1, 0).getDate();
  const result: Record<string, string[]> = {};

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(input.year, input.month, day);
    const windows = byDow.get(date.getDay());
    if (!windows) continue;
    const starts: string[] = [];
    for (const window of windows) {
      for (let minute = window.start; minute + SLOT_STEP_MINUTES <= window.end; minute += SLOT_STEP_MINUTES) {
        const slot = new Date(
          input.year,
          input.month,
          day,
          Math.floor(minute / 60),
          minute % 60,
          0,
          0,
        );
        if (slot.getTime() <= now) continue;
        if (overlapsBooking(slot, booked, SLOT_OVERLAP_MS)) continue;
        starts.push(slot.toISOString());
      }
    }
    if (starts.length > 0) result[ymd(date)] = starts;
  }

  return result;
}
