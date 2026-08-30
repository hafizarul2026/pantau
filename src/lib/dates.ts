const TZ = "Asia/Kuala_Lumpur";

const DAY_NAMES = [
  "Ahad",
  "Isnin",
  "Selasa",
  "Rabu",
  "Khamis",
  "Jumaat",
  "Sabtu",
] as const;

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Mac",
  "April",
  "Mei",
  "Jun",
  "Julai",
  "Ogos",
  "September",
  "Oktober",
  "November",
  "Disember",
] as const;

export function klParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

export function toISODate(date = new Date()) {
  const { year, month, day } = klParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseISODate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

export function compareISODate(a: string, b: string) {
  return a.localeCompare(b);
}

export function addDaysISO(iso: string, days: number) {
  const { year, month, day } = parseISODate(iso);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const y = utc.getUTCFullYear();
  const m = utc.getUTCMonth() + 1;
  const d = utc.getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function weekdayIndex(iso: string) {
  const { year, month, day } = parseISODate(iso);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function startOfWeekISO(iso: string) {
  const index = weekdayIndex(iso);
  const mondayOffset = index === 0 ? -6 : 1 - index;
  return addDaysISO(iso, mondayOffset);
}

export function endOfWeekISO(iso: string) {
  return addDaysISO(startOfWeekISO(iso), 6);
}

export function startOfMonthISO(iso: string) {
  const { year, month } = parseISODate(iso);
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function daysInMonth(iso: string) {
  const { year, month } = parseISODate(iso);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function formatLong(iso: string) {
  const { year, month, day } = parseISODate(iso);
  return `${DAY_NAMES[weekdayIndex(iso)]}, ${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatShort(iso: string) {
  const { month, day } = parseISODate(iso);
  return `${day} ${MONTH_NAMES[month - 1]}`;
}

export function formatMonthYear(iso: string) {
  const { year, month } = parseISODate(iso);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function relativeDue(iso: string, today = toISODate()) {
  if (iso === today) return "Hari ini";
  if (iso === addDaysISO(today, 1)) return "Esok";
  if (iso === addDaysISO(today, -1)) return "Semalam";
  const diff =
    (Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
    86_400_000;
  if (diff < 0) return `${Math.abs(diff)} hari lewat`;
  return formatShort(iso);
}

export const DAY_SHORT = [
  "Ahd",
  "Isn",
  "Sel",
  "Rab",
  "Kha",
  "Jum",
  "Sab",
] as const;

export function formatReceived(isoDateTime: string) {
  return formatShort(toISODate(new Date(isoDateTime)));
}

export { DAY_NAMES, MONTH_NAMES, TZ };
