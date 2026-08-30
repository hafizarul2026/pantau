import { MONITORED_MAILBOX } from "@/lib/mailbox";
import {
  addDaysISO,
  daysInMonth,
  startOfMonthISO,
  startOfWeekISO,
  toISODate,
} from "@/lib/dates";
import type { Task, UnreadEmail } from "@/lib/types";

function upcomingFriday(today: string) {
  const friday = addDaysISO(startOfWeekISO(today), 4);
  return friday >= today ? friday : addDaysISO(friday, 7);
}

export function seedTasks(today = toISODate()): Task[] {
  const now = new Date().toISOString();
  const weekFriday = upcomingFriday(today);
  const monthEnd = `${startOfMonthISO(today).slice(0, 8)}${String(daysInMonth(today)).padStart(2, "0")}`;

  return [
    {
      id: "t-emel-pagi",
      title: "Semak emel belum dibaca",
      notes: "Peti mohd_hafizarul@moh.gov.my sahaja. Balas atau jadikan tugasan.",
      status: "in_progress",
      horizon: "daily",
      priority: "high",
      dueDate: today,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "t-nota-mesyuarat",
      title: "Sediakan nota mesyuarat pagi",
      notes: "Tiga keputusan yang mesti keluar dari mesyuarat. Bawa salinan agenda.",
      status: "not_started",
      horizon: "daily",
      priority: "high",
      dueDate: today,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "t-aduan-klinik",
      title: "Follow up aduan klinik",
      notes: "Aduan minggu lepas masih terbuka. Sahkan status dengan unit berkenaan.",
      status: "in_progress",
      horizon: "daily",
      priority: "high",
      dueDate: addDaysISO(today, -2),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "t-laporan-mingguan",
      title: "Hantar laporan mingguan unit",
      notes: "Ringkasan 1 muka: siap, tertunggak, bantuan yang diperlukan.",
      status: "not_started",
      horizon: "weekly",
      priority: "medium",
      dueDate: weekFriday,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "t-stok",
      title: "Kemaskini senarai stok",
      notes: "Padankan rekod dengan bilik stor. Tandakan item hampir habis.",
      status: "in_progress",
      horizon: "weekly",
      priority: "medium",
      dueDate: addDaysISO(today, 2),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "t-kpi",
      title: "Laporan KPI bulan ini",
      notes: "Kumpul angka unit, tulis 5 bullet, hantar draf kepada penyelia.",
      status: "not_started",
      horizon: "monthly",
      priority: "high",
      dueDate: monthEnd < today ? today : monthEnd,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "t-bajet",
      title: "Semak bajet unit",
      notes: "Baki vs komitmen. Cadangkan 3 perbelanjaan yang boleh ditunda.",
      status: "not_started",
      horizon: "monthly",
      priority: "low",
      dueDate: addDaysISO(today, 10),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "t-selesai-contoh",
      title: "Hantar minit mesyuarat minggu lepas",
      notes: "Sudah diedarkan kepada ahli mesyuarat.",
      status: "done",
      horizon: "weekly",
      priority: "medium",
      dueDate: addDaysISO(today, -3),
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export const DEMO_INBOX: UnreadEmail[] = [
  {
    id: "m-kpi",
    mailbox: MONITORED_MAILBOX,
    from: "pengarah.kesihatan@moh.gov.my",
    fromName: "Pejabat Pengarah Kesihatan",
    to: MONITORED_MAILBOX,
    subject: "Laporan KPI bulan Ogos perlu dihantar sebelum 3 petang Isnin",
    preview:
      "Assalamualaikum Encik Hafiz. Sila hantar draf KPI unit sebelum mesyuarat pengurusan. Lampirkan angka pencapaian dan isu tertunggak.",
    receivedAt: "2026-08-30T01:12:00.000Z",
    unread: true,
  },
  {
    id: "m-mesyuarat",
    mailbox: MONITORED_MAILBOX,
    from: "pentadbiran@moh.gov.my",
    fromName: "Pentadbiran Kesihatan",
    to: MONITORED_MAILBOX,
    subject: "Mesyuarat Jawatankuasa Kualiti — 1 September 2026",
    preview:
      "Kehadiran wajib. Agenda: aduan klinik, stok kritikal, dan laporan kualiti suku tahun. Sila baca kertas kerja yang dilampirkan.",
    receivedAt: "2026-08-29T23:40:00.000Z",
    unread: true,
  },
  {
    id: "m-elaun",
    mailbox: MONITORED_MAILBOX,
    from: "kewangan@moh.gov.my",
    fromName: "Unit Kewangan",
    to: MONITORED_MAILBOX,
    subject: "Pengesahan tuntutan elaun masih belum lengkap",
    preview:
      "Borang tuntutan anda kekurangan lampiran resit. Sila lengkapkan dan hantar semula dalam 2 hari bekerja.",
    receivedAt: "2026-08-29T07:05:00.000Z",
    unread: true,
  },
  {
    id: "m-cuti",
    mailbox: MONITORED_MAILBOX,
    from: "hr@moh.gov.my",
    fromName: "Sumber Manusia",
    to: MONITORED_MAILBOX,
    subject: "Peringatan: borang cuti tahunan yang belum dihantar",
    preview:
      "Rekod menunjukkan permohonan cuti masih draf. Lengkapkan borang jika cuti minggu depan masih berkuat kuasa.",
    receivedAt: "2026-08-28T09:18:00.000Z",
    unread: true,
  },
  {
    id: "m-other-account",
    mailbox: "jemputklik@gmail.com",
    from: "newsletter@example.com",
    fromName: "Promo",
    to: "jemputklik@gmail.com",
    subject: "Emel akaun peribadi — jangan paparkan",
    preview: "Ini emel akaun lain dan mesti ditapis keluar.",
    receivedAt: "2026-08-30T03:00:00.000Z",
    unread: true,
  },
];
