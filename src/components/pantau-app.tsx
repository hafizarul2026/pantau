"use client";

import { useEffect, useMemo, useState, type SetStateAction } from "react";
import {
  AlertTriangle,
  Check,
  Circle,
  Inbox,
  Lightbulb,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Plus,
  Timer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MONITORED_MAILBOX } from "@/lib/mailbox";
import {
  addDaysISO,
  DAY_SHORT,
  daysInMonth,
  endOfWeekISO,
  formatLong,
  formatMonthYear,
  formatReceived,
  formatShort,
  relativeDue,
  startOfMonthISO,
  startOfWeekISO,
  toISODate,
  weekdayIndex,
} from "@/lib/dates";
import { relatedEmailsForTask, suggestHowToFinish } from "@/lib/suggestions";
import {
  createTaskId,
  isOverdue,
  loadReadEmailIds,
  loadReminderDismissed,
  loadTasks,
  saveReadEmailIds,
  saveReminderDismissed,
  saveTasks,
  withUpdatedAt,
} from "@/lib/store";
import type {
  PeriodView,
  StatusFilter,
  Task,
  TaskStatus,
  UnreadEmail,
} from "@/lib/types";
import { TaskDialog } from "@/components/task-dialog";

type EmailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; emails: UnreadEmail[]; notice: string };

const STATUS_LABEL: Record<TaskStatus | "overdue", string> = {
  not_started: "Belum mula",
  in_progress: "Sedang dibuat",
  done: "Selesai",
  overdue: "Lewat",
};

const PERIOD_LABEL: Record<PeriodView, string> = {
  today: "hari ini",
  week: "minggu ini",
  month: "bulan ini",
  all: "semua tugasan",
};

function effectiveStatus(task: Task, today: string): TaskStatus | "overdue" {
  if (task.status === "done") return "done";
  if (isOverdue(task, today)) return "overdue";
  return task.status;
}

function inPeriod(task: Task, view: PeriodView, today: string) {
  if (view === "all") return true;
  const overdue = isOverdue(task, today);
  if (view === "today") return task.dueDate === today || overdue;
  if (view === "week") {
    const inWeek =
      task.dueDate >= startOfWeekISO(today) &&
      task.dueDate <= endOfWeekISO(today);
    return inWeek || overdue;
  }
  return task.dueDate.startsWith(today.slice(0, 7)) || overdue;
}

function StatusDot({ status }: { status: TaskStatus | "overdue" }) {
  const map = {
    not_started: "text-zinc-500",
    in_progress: "text-amber-400",
    done: "text-emerald-400",
    overdue: "text-red-500",
  };
  const Icon =
    status === "done"
      ? Check
      : status === "overdue"
        ? AlertTriangle
        : status === "in_progress"
          ? Timer
          : Circle;
  return <Icon className={`size-4 shrink-0 ${map[status]}`} />;
}

export function PantauApp() {
  const today = toISODate();
  const [tasks, setTasksState] = useState<Task[]>(loadTasks);
  const [period, setPeriod] = useState<PeriodView>("today");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dayFilter, setDayFilter] = useState<string | null>(today);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [emailState, setEmailState] = useState<EmailState>({
    status: "loading",
  });
  const [readIds, setReadIdsState] = useState<string[]>(loadReadEmailIds);
  const [reminderOpen, setReminderOpen] = useState(
    () => loadReminderDismissed() !== today,
  );

  function setTasks(updater: SetStateAction<Task[]>) {
    setTasksState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      saveTasks(next);
      return next;
    });
  }

  function setReadIds(next: string[]) {
    setReadIdsState(next);
    saveReadEmailIds(next);
  }

  useEffect(() => {
    let cancelled = false;
    async function loadEmails() {
      setEmailState({ status: "loading" });
      try {
        const response = await fetch(
          `/api/emails?mailbox=${encodeURIComponent(MONITORED_MAILBOX)}`,
        );
        const data = (await response.json()) as {
          emails?: UnreadEmail[];
          notice?: string;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error ?? "Tidak dapat semak emel.");
        }
        if (!cancelled) {
          setEmailState({
            status: "ready",
            emails: data.emails ?? [],
            notice: data.notice ?? "",
          });
        }
      } catch (error) {
        if (!cancelled) {
          setEmailState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Tidak dapat semak emel.",
          });
        }
      }
    }
    loadEmails();
    return () => {
      cancelled = true;
    };
  }, []);

  const unreadEmails = useMemo(() => {
    if (emailState.status !== "ready") return [];
    return emailState.emails.filter((email) => !readIds.includes(email.id));
  }, [emailState, readIds]);

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) => inPeriod(task, period, today))
      .filter((task) => {
        if (!dayFilter) return true;
        if (task.dueDate === dayFilter) return true;
        return (
          period === "today" &&
          dayFilter === today &&
          isOverdue(task, today)
        );
      })
      .filter((task) => {
        if (statusFilter === "all") return true;
        return effectiveStatus(task, today) === statusFilter;
      })
      .sort((a, b) => {
        const rank = (task: Task) => {
          const status = effectiveStatus(task, today);
          if (status === "overdue") return 0;
          if (status === "in_progress") return 1;
          if (status === "not_started") return 2;
          return 3;
        };
        return rank(a) - rank(b) || a.dueDate.localeCompare(b.dueDate);
      });
  }, [tasks, period, dayFilter, statusFilter, today]);

  const selected =
    visibleTasks.find((task) => task.id === selectedId) ??
    visibleTasks[0] ??
    null;

  const periodTasks = tasks.filter((task) => inPeriod(task, period, today));
  const todayTasks = tasks.filter((task) => inPeriod(task, "today", today));
  const counts = {
    overdue: periodTasks.filter(
      (task) => effectiveStatus(task, today) === "overdue",
    ).length,
    in_progress: periodTasks.filter(
      (task) => task.status === "in_progress" && !isOverdue(task, today),
    ).length,
    not_started: periodTasks.filter(
      (task) => task.status === "not_started" && !isOverdue(task, today),
    ).length,
    done: periodTasks.filter((task) => task.status === "done").length,
  };
  const reminderOpenCount = todayTasks.filter(
    (task) => task.status !== "done",
  ).length;
  const reminderOverdue = todayTasks.filter((task) =>
    isOverdue(task, today),
  ).length;
  const doneRatio = periodTasks.length
    ? Math.round((counts.done / periodTasks.length) * 100)
    : 0;

  function updateTask(id: string, patch: Partial<Task>) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? withUpdatedAt(task, patch) : task,
      ),
    );
  }

  function removeTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function markEmailRead(id: string) {
    setReadIds([...new Set([...readIds, id])]);
  }

  function convertEmailToTask(email: UnreadEmail) {
    if (tasks.some((task) => task.sourceEmailId === email.id)) {
      toast.message("Tugasan daripada emel ini sudah ada.");
      markEmailRead(email.id);
      return;
    }
    const now = new Date().toISOString();
    const urgent = /segera|penting|kpi|wajib/i.test(email.subject);
    const task: Task = {
      id: createTaskId(),
      title: email.subject,
      notes: `Daripada ${email.fromName} <${email.from}>\n\n${email.preview}`,
      status: "not_started",
      horizon: "daily",
      priority: urgent ? "high" : "medium",
      dueDate: today,
      createdAt: now,
      updatedAt: now,
      sourceEmailId: email.id,
    };
    setTasks((current) => [task, ...current]);
    setSelectedId(task.id);
    markEmailRead(email.id);
    toast.success("Emel dijadikan tugasan");
  }

  const related = selected
    ? relatedEmailsForTask(selected, unreadEmails)
    : [];
  const suggestion = selected
    ? suggestHowToFinish(selected, today, related)
    : null;

  const emptyCopy = dayFilter && period !== "today"
    ? `Tiada tugasan pada ${formatShort(dayFilter)}.`
    : "Tiada tugasan dalam tapisan ini.";

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-red-900/50 bg-black/50 backdrop-blur-md">
        <div className="h-1 w-full bg-gradient-to-r from-red-700 via-amber-500 to-red-900" />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-10 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-[0_0_24px_oklch(0.6_0.23_28_/_0.45)]">
              <Check className="size-5" strokeWidth={3} />
            </div>
            <div>
              <p className="font-heading text-[11px] font-semibold tracking-[0.28em] text-red-500">
                Papan kerja
              </p>
              <h1 className="font-heading text-3xl font-bold tracking-[0.14em] text-white">
                Pantau
              </h1>
              <p className="text-sm text-muted-foreground">
                Kerja harian, mingguan dan bulanan — {formatLong(today)}
              </p>
            </div>
          </div>
          <div className="flex min-w-0 flex-col items-start gap-2 sm:items-end">
            <Badge
              variant="secondary"
              className="h-7 max-w-full gap-1.5 truncate rounded-sm border border-red-800/60 bg-red-950/70 px-3 text-red-100"
            >
              <Lock className="size-3 shrink-0" />
              <span className="truncate">{MONITORED_MAILBOX}</span>
            </Badge>
            <p className="text-xs text-muted-foreground">
              Emel akaun lain tidak disemak.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        {reminderOpen ? (
          <Card className="overflow-hidden border-none bg-gradient-to-br from-red-950 via-zinc-950 to-black text-red-50 shadow-[0_0_40px_oklch(0.45_0.2_28_/_0.35)] ring-1 ring-red-800/50">
            <CardHeader className="gap-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-[11px] font-semibold tracking-[0.28em] text-red-400">
                    Peringatan setiap hari
                  </p>
                  <CardTitle className="font-heading text-xl tracking-[0.08em] text-white">
                    Apa yang belum siap hari ini
                  </CardTitle>
                  <CardDescription className="text-red-100/75">
                    Ringkasan emel belum dibaca di {MONITORED_MAILBOX} dan
                    tugasan yang masih terbuka.
                  </CardDescription>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    saveReminderDismissed(today);
                    setReminderOpen(false);
                  }}
                >
                  Tutup untuk hari ini
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <ReminderStat
                icon={<Mail className="size-4" />}
                label="Emel belum dibaca"
                value={
                  emailState.status === "loading"
                    ? "…"
                    : emailState.status === "error"
                      ? "—"
                      : String(unreadEmails.length)
                }
                hint="Peti MOH sahaja"
              />
              <ReminderStat
                icon={<Circle className="size-4" />}
                label="Tugasan belum siap"
                value={String(reminderOpenCount)}
                hint="Belum mula + sedang dibuat + lewat"
              />
              <ReminderStat
                icon={<AlertTriangle className="size-4" />}
                label="Sudah lewat"
                value={String(reminderOverdue)}
                hint="Tarikh sudah lalu, belum selesai"
              />
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Lewat"
            value={counts.overdue}
            tone="rose"
            active={statusFilter === "overdue"}
            onClick={() =>
              setStatusFilter((current) =>
                current === "overdue" ? "all" : "overdue",
              )
            }
          />
          <StatCard
            label="Sedang dibuat"
            value={counts.in_progress}
            tone="amber"
            active={statusFilter === "in_progress"}
            onClick={() =>
              setStatusFilter((current) =>
                current === "in_progress" ? "all" : "in_progress",
              )
            }
          />
          <StatCard
            label="Belum mula"
            value={counts.not_started}
            tone="slate"
            active={statusFilter === "not_started"}
            onClick={() =>
              setStatusFilter((current) =>
                current === "not_started" ? "all" : "not_started",
              )
            }
          />
          <StatCard
            label="Selesai"
            value={counts.done}
            tone="teal"
            active={statusFilter === "done"}
            onClick={() =>
              setStatusFilter((current) =>
                current === "done" ? "all" : "done",
              )
            }
          />
        </section>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-md">
              <CardTitle className="font-heading tracking-[0.1em]">
                Kemajuan {PERIOD_LABEL[period]}
              </CardTitle>
              <CardDescription>
                {counts.done} daripada {periodTasks.length} tugasan sudah
                ditanda selesai.
              </CardDescription>
              <Progress value={doneRatio} className="mt-3 h-1.5 rounded-sm" />
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus data-icon="inline-start" />
              Tambah tugasan
            </Button>
          </CardHeader>
        </Card>

        <div className="flex flex-col gap-3">
          <Tabs
            value={period}
            onValueChange={(value) => {
              const next = value as PeriodView;
              setPeriod(next);
              setDayFilter(next === "today" ? today : null);
            }}
          >
            <TabsList className="h-9 w-full max-w-xl">
              <TabsTrigger value="today" className="px-2 text-xs sm:text-sm">
                Hari ini
              </TabsTrigger>
              <TabsTrigger value="week" className="px-2 text-xs sm:text-sm">
                Minggu ini
              </TabsTrigger>
              <TabsTrigger value="month" className="px-2 text-xs sm:text-sm">
                Bulan ini
              </TabsTrigger>
              <TabsTrigger value="all" className="px-2 text-xs sm:text-sm">
                Semua
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {period === "week" ? (
            <WeekStrip
              today={today}
              selected={dayFilter}
              tasks={tasks}
              onSelect={(iso) =>
                setDayFilter((current) => (current === iso ? null : iso))
              }
            />
          ) : null}
          {period === "month" ? (
            <MonthGrid
              today={today}
              selected={dayFilter}
              tasks={tasks}
              onSelect={(iso) =>
                setDayFilter((current) => (current === iso ? null : iso))
              }
            />
          ) : null}

          {dayFilter && period !== "today" ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Menunjuk {formatShort(dayFilter)}.</span>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setDayFilter(null)}
              >
                Lihat semua {period === "week" ? "minggu" : "bulan"}
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["all", "Semua status"],
                ["overdue", "Lewat"],
                ["in_progress", "Sedang dibuat"],
                ["not_started", "Belum mula"],
                ["done", "Selesai"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={statusFilter === value ? "default" : "outline"}
                aria-pressed={statusFilter === value}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <section className="flex flex-col gap-3">
            {visibleTasks.length === 0 ? (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle>{emptyCopy}</CardTitle>
                  <CardDescription>
                    Tambah kerja baru, tukar tempoh, atau jadikan emel belum
                    dibaca sebagai tugasan.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(null);
                      setDialogOpen(true);
                    }}
                  >
                    <Plus data-icon="inline-start" />
                    Tambah tugasan
                  </Button>
                </CardContent>
              </Card>
            ) : (
              visibleTasks.map((task) => {
                const status = effectiveStatus(task, today);
                const active = selected?.id === task.id;
                return (
                  <article
                    key={task.id}
                    className={`rounded-sm ring-1 transition ${
                      active
                        ? "bg-card ring-red-600/70 shadow-[0_0_24px_oklch(0.55_0.22_28_/_0.25)]"
                        : "bg-card/80 ring-white/10 hover:ring-red-700/50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedId(task.id)}
                        className="flex min-w-0 flex-1 gap-3 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <StatusDot status={status} />
                        <div className="min-w-0">
                          <p className="font-medium leading-snug">
                            {task.title}
                          </p>
                          {task.notes ? (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {task.notes}
                            </p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <Badge
                              variant={
                                status === "overdue" ? "destructive" : "secondary"
                              }
                            >
                              {STATUS_LABEL[status]}
                            </Badge>
                            <Badge variant="outline">
                              {relativeDue(task.dueDate, today)}
                            </Badge>
                            <Badge variant="outline">
                              {task.horizon === "daily"
                                ? "Harian"
                                : task.horizon === "weekly"
                                  ? "Mingguan"
                                  : "Bulanan"}
                            </Badge>
                            {task.priority === "high" ? (
                              <Badge variant="destructive">Utama</Badge>
                            ) : null}
                          </div>
                        </div>
                      </button>
                      <div className="flex flex-wrap gap-1.5 sm:max-w-52 sm:justify-end">
                        {(
                          [
                            ["not_started", "Belum mula"],
                            ["in_progress", "Sedang"],
                            ["done", "Selesai"],
                          ] as const
                        ).map(([value, label]) => (
                          <Button
                            key={value}
                            size="xs"
                            variant={
                              task.status === value ? "default" : "outline"
                            }
                            aria-pressed={task.status === value}
                            onClick={() =>
                              updateTask(task.id, { status: value })
                            }
                          >
                            {label}
                          </Button>
                        ))}
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          aria-label="Kemaskini tugasan"
                          title="Kemaskini"
                          onClick={() => {
                            setEditing(task);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          aria-label="Padam tugasan"
                          title="Padam"
                          onClick={() => setPendingDelete(task)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 font-heading tracking-[0.12em]">
                    <Inbox className="size-4" />
                    Emel belum dibaca
                  </CardTitle>
                  <Badge variant="secondary">{unreadEmails.length}</Badge>
                </div>
                <CardDescription>
                  Semakan terhad kepada {MONITORED_MAILBOX}.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {emailState.status === "loading" ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Menyemak peti MOH…
                  </p>
                ) : null}
                {emailState.status === "error" ? (
                  <p className="text-sm text-destructive">
                    {emailState.message}
                  </p>
                ) : null}
                {emailState.status === "ready" && unreadEmails.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Tiada emel belum dibaca dalam peti ini.
                  </p>
                ) : null}
                {unreadEmails.map((email) => (
                  <div
                    key={email.id}
                    className="rounded-lg bg-muted/60 p-3 ring-1 ring-foreground/5"
                  >
                    <p className="text-xs text-muted-foreground">
                      {email.fromName} · {formatReceived(email.receivedAt)}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-snug">
                      {email.subject}
                    </p>
                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                      {email.preview}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Button
                        size="xs"
                        onClick={() => convertEmailToTask(email)}
                      >
                        Jadikan tugasan
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => markEmailRead(email.id)}
                      >
                        Tanda dibaca
                      </Button>
                    </div>
                  </div>
                ))}
                {emailState.status === "ready" && emailState.notice ? (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {emailState.notice}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading tracking-[0.12em]">
                  <Lightbulb className="size-4" />
                  Cara selesaikan
                </CardTitle>
                <CardDescription>
                  {selected
                    ? `Cadangan untuk “${selected.title}”.`
                    : "Pilih tugasan untuk cadangan langkah."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selected || !suggestion ? (
                  <p className="text-sm text-muted-foreground">
                    Tiada tugasan dalam paparan ini.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="font-medium">{suggestion.headline}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Blok masa: {suggestion.timebox}
                      </p>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {suggestion.why}
                    </p>
                    <ol className="list-decimal space-y-2 pl-4 text-sm">
                      {suggestion.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <div className="rounded-sm border-l-4 border-red-500 bg-red-950/70 p-3 text-sm text-red-50 ring-1 ring-red-800/40">
                      <p className="font-heading text-[11px] font-semibold tracking-[0.22em] text-red-400">
                        Langkah seterusnya
                      </p>
                      <p className="mt-1">{suggestion.nextAction}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <TaskDialog
        key={editing?.id ?? (dialogOpen ? "new" : "closed")}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        today={today}
        onSave={(draft) => {
          if (editing) {
            updateTask(editing.id, draft);
            toast.success("Tugasan dikemaskini");
          } else {
            const now = new Date().toISOString();
            const task: Task = {
              id: createTaskId(),
              createdAt: now,
              updatedAt: now,
              status: "not_started",
              ...draft,
            };
            setTasks((current) => [task, ...current]);
            setSelectedId(task.id);
            toast.success("Tugasan ditambah");
          }
          setDialogOpen(false);
        }}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam tugasan?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.title}” akan dibuang dari senarai. Tindakan ini
              tidak boleh diundur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) removeTask(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Padam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ReminderStat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-sm bg-black/35 p-3 ring-1 ring-red-500/25">
      <div className="flex items-center gap-2 text-red-200">
        {icon}
        <span className="font-heading text-[11px] tracking-[0.16em]">{label}</span>
      </div>
      <p className="mt-1 font-heading text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="text-xs text-red-100/60">{hint}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone: "rose" | "amber" | "slate" | "teal";
  active: boolean;
  onClick: () => void;
}) {
  const tones = {
    rose: "from-red-950 to-zinc-950 text-red-400",
    amber: "from-amber-950 to-zinc-950 text-amber-400",
    slate: "from-zinc-900 to-zinc-950 text-zinc-300",
    teal: "from-emerald-950 to-zinc-950 text-emerald-400",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-sm border-l-4 bg-gradient-to-br text-left ring-1 transition ${tones[tone]} ${
        tone === "rose"
          ? "border-red-500"
          : tone === "amber"
            ? "border-amber-400"
            : tone === "teal"
              ? "border-emerald-400"
              : "border-zinc-500"
      } ${
        active ? "ring-current/50 shadow-md" : "ring-white/10 hover:ring-current/35"
      }`}
    >
      <div className="flex flex-col gap-1 p-4">
        <p className="font-heading text-xs tracking-[0.18em] text-current/80">
          {label}
        </p>
        <p className="font-heading text-3xl font-semibold tracking-tight">{value}</p>
        <p className="text-[11px] text-current/55">
          {active ? "Tapisan aktif — klik lagi untuk semua" : "Klik untuk tapis"}
        </p>
      </div>
    </button>
  );
}

function WeekStrip({
  today,
  selected,
  tasks,
  onSelect,
}: {
  today: string;
  selected: string | null;
  tasks: Task[];
  onSelect: (iso: string) => void;
}) {
  const start = startOfWeekISO(today);
  const days = Array.from({ length: 7 }, (_, index) =>
    addDaysISO(start, index),
  );
  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
      {days.map((iso) => {
        const count = tasks.filter(
          (task) => task.dueDate === iso && task.status !== "done",
        ).length;
        const isToday = iso === today;
        const active = selected === iso;
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelect(iso)}
            aria-pressed={active}
            className={`min-w-0 rounded-sm px-0.5 py-2 text-center ring-1 transition sm:px-1 ${
              active
                ? "bg-primary text-primary-foreground ring-primary"
                : isToday
                  ? "bg-red-950 ring-red-700/60"
                  : "bg-card ring-white/10 hover:ring-red-700/50"
            }`}
          >
            <p className="text-[10px] font-medium">
              {DAY_SHORT[weekdayIndex(iso)]}
            </p>
            <p className="text-lg font-semibold leading-none">
              {Number(iso.slice(8))}
            </p>
            <p
              className={`mt-1 text-[10px] ${
                active ? "text-primary-foreground/80" : "text-muted-foreground"
              }`}
            >
              {count ? `${count}` : isToday ? "hari" : "—"}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function MonthGrid({
  today,
  selected,
  tasks,
  onSelect,
}: {
  today: string;
  selected: string | null;
  tasks: Task[];
  onSelect: (iso: string) => void;
}) {
  const start = startOfMonthISO(today);
  const leading = (weekdayIndex(start) + 6) % 7;
  const total = daysInMonth(today);
  const cells = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: total }, (_, index) => addDaysISO(start, index)),
  ];

  return (
    <div>
      <p className="mb-2 text-sm font-medium">{formatMonthYear(today)}</p>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-medium tracking-wide text-muted-foreground">
        {["Isn", "Sel", "Rab", "Kha", "Jum", "Sab", "Ahd"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, index) => {
          if (!iso) return <div key={`empty-${index}`} />;
          const count = tasks.filter(
            (task) => task.dueDate === iso && task.status !== "done",
          ).length;
          const active = selected === iso;
          const isToday = iso === today;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              aria-pressed={active}
              className={`flex min-h-11 flex-col items-center justify-center rounded-sm text-xs ring-1 transition ${
                active
                  ? "bg-primary text-primary-foreground ring-primary"
                  : isToday
                    ? "bg-red-950 ring-red-700/50"
                    : "bg-card ring-white/8 hover:ring-red-700/40"
              }`}
            >
              {Number(iso.slice(8))}
              {count > 0 ? (
                <span
                  className={`mt-0.5 size-1 rounded-full ${
                    active ? "bg-white" : "bg-red-500"
                  }`}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
