import type { Suggestion, Task, UnreadEmail } from "@/lib/types";
import { relativeDue } from "@/lib/dates";

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function suggestHowToFinish(
  task: Task,
  today: string,
  relatedEmails: UnreadEmail[] = [],
): Suggestion {
  const haystack = `${task.title} ${task.notes}`.toLowerCase();
  const overdue = task.status !== "done" && task.dueDate < today;
  const emailHint =
    relatedEmails.length > 0
      ? `Ada ${relatedEmails.length} emel berkaitan dalam peti mohd_hafizarul@moh.gov.my — baca dulu sebelum mula.`
      : "";

  if (includesAny(haystack, ["laporan", "kpi", "report"])) {
    return {
      headline: overdue
        ? "Hantar versi minimum hari ini, elak nak sempurna"
        : "Siapkan laporan dalam 3 blok pendek",
      timebox: overdue ? "20 minit" : "45 minit",
      why: overdue
        ? "Tugas ini sudah lewat. Penyelia lebih suka draf lengkap daripada menunggu versi cantik."
        : "Laporan cepat siap bila data, rangka dan semakan dipisahkan.",
      steps: [
        "Buka fail KPI atau data bulan ini. Salin angka ke satu muka surat — jangan tulis dulu.",
        "Tulis 5 bullet: pencapaian, isu, tindakan, keperluan, rumusan.",
        "Hantar draf kepada penyelia. Tulis ‘draf untuk semakan’ supaya tak tertahan.",
      ],
      nextAction: overdue
        ? "Buka fail data sekarang dan salin 5 angka utama."
        : "Buat rangka 5 bullet dalam 10 minit.",
    };
  }

  if (includesAny(haystack, ["mesyuarat", "meeting", "agenda", "minit"])) {
    return {
      headline: "Bersedia 15 minit sebelum mesyuarat",
      timebox: "15 minit",
      why: "Mesyuarat jadi pendek bila agenda dan keputusan yang dihajati sudah jelas.",
      steps: [
        "Tulis 3 perkara yang mesti diputuskan. Buang yang cuma ‘untuk makluman’.",
        "Baca kertas kerja atau emel berkaitan — tandakan soalan sahaja.",
        "Sediakan 1 ayat rumusan yang anda mahu masuk minit mesyuarat.",
      ],
      nextAction: emailHint || "Tulis 3 keputusan yang anda mahu bawa keluar dari mesyuarat.",
    };
  }

  if (includesAny(haystack, ["emel", "email", "balas", "inbox"])) {
    return {
      headline: "Kosongkan emel dengan balasan pendek",
      timebox: "12 minit",
      why: "Emel tertunggak jadi tugasan tersembunyi. Balas atau jadikan tugas — jangan biar terbuka.",
      steps: [
        "Buka peti mohd_hafizarul@moh.gov.my sahaja. Abaikan akaun lain.",
        "Untuk setiap emel: balas 3 ayat, pindah ke tugas, atau arkib.",
        "Tutup tab emel lepas 12 minit. Jangan semak semula sampai petang.",
      ],
      nextAction: "Balas emel paling lama tertunggak dalam 3 ayat.",
    };
  }

  if (includesAny(haystack, ["cuti", "borang", "hr", "tuntutan", "elaun"])) {
    return {
      headline: "Lengkapkan borang sekali duduk",
      timebox: "20 minit",
      why: "Borang HR/kewangan selalu tertangguh sebab lampiran. Kumpul semua dulu.",
      steps: [
        "Muat turun borang dan senaraikan lampiran yang wajib.",
        "Isi tarikh, jumlah dan sebab. Jangan biarkan lajur kosong.",
        "Hantar, kemudian simpan PDF + nombor rujukan dalam nota tugas ini.",
      ],
      nextAction: "Buka borang dan isi tarikh serta jumlah sekarang.",
    };
  }

  if (includesAny(haystack, ["stok", "inventori", "klinik", "aduan"])) {
    return {
      headline: "Kira, sahkan, kemudian bertindak",
      timebox: "30 minit",
      why: "Isu operasi selesai lebih cepat bila nombor dan pemilik tindakan jelas.",
      steps: [
        "Tulis fakta: apa, berapa, sejak bila. Jangan cadang dulu.",
        "Hubungi orang yang boleh sahkan (unit/klinik) — 1 panggilan, 1 mesej.",
        "Catat tindakan seterusnya dan tarikh follow-up dalam tugas ini.",
      ],
      nextAction: "Tulis 3 fakta yang anda sudah tahu sebelum telefon sesiapa.",
    };
  }

  if (includesAny(haystack, ["bajet", "belanja", "kewangan"])) {
    return {
      headline: "Semak bajet dari angka, bukan dari rasa",
      timebox: "25 minit",
      why: "Perbincangan bajet jadi pendek bila baki dan komitmen sudah di atas kertas.",
      steps: [
        "Buka spreadsheet unit. Tandakan baki vs komitmen bulan ini.",
        "Senaraikan 3 perbelanjaan yang boleh ditunda.",
        "Hantar ringkasan 5 baris kepada ketua unit.",
      ],
      nextAction: "Tulis baki semasa dan 3 item terbesar.",
    };
  }

  const statusLead =
    task.status === "not_started"
      ? "Mulakan dengan langkah paling kecil supaya momentum ada."
      : task.status === "in_progress"
        ? "Anda sudah mula — tutup jurang terakhir sahaja."
        : "Tugas ini sudah selesai. Semak kalau ada follow-up.";

  return {
    headline: overdue
      ? `Tutup tugas lewat (${relativeDue(task.dueDate, today)}) dengan hasil minimum`
      : "Pecahkan kerja kepada satu langkah nampak",
    timebox: overdue ? "25 minit" : "30 minit",
    why: [statusLead, emailHint].filter(Boolean).join(" "),
    steps: [
      "Tulis hasil nampak: apa yang wujud lepas sesi ini (fail, emel, keputusan).",
      "Buat langkah pertama yang kurang 10 minit. Telefon/tulis/buka fail.",
      "Kalau masih tertangguh, kecilkan skop 50% dan tetapkan masa hantar.",
    ],
    nextAction: overdue
      ? "Set pemasa 25 minit dan buat versi yang boleh dihantar."
      : "Tulis hasil nampak dalam satu ayat, kemudian mula.",
  };
}

export function relatedEmailsForTask(task: Task, emails: UnreadEmail[]) {
  const words = task.title
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4);
  if (words.length === 0) return [];
  return emails.filter((email) => {
    const blob = `${email.subject} ${email.preview}`.toLowerCase();
    return words.some((word) => blob.includes(word));
  });
}
