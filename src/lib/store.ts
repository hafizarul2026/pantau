import { seedTasks } from "@/lib/seed";
import { toISODate } from "@/lib/dates";
import type { Task, TaskStatus } from "@/lib/types";

const TASKS_KEY = "pantau-tasks-v1";
const EMAIL_READ_KEY = "pantau-email-read-v1";
const REMINDER_KEY = "pantau-reminder-dismissed-v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function loadTasks(): Task[] {
  if (!canUseStorage()) return seedTasks();
  try {
    const raw = window.localStorage.getItem(TASKS_KEY);
    if (!raw) {
      const seeded = seedTasks();
      window.localStorage.setItem(TASKS_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Task[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeded = seedTasks();
      window.localStorage.setItem(TASKS_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return parsed;
  } catch {
    return seedTasks();
  }
}

export function saveTasks(tasks: Task[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function loadReadEmailIds(): string[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(EMAIL_READ_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveReadEmailIds(ids: string[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(EMAIL_READ_KEY, JSON.stringify(ids));
}

export function loadReminderDismissed(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(REMINDER_KEY);
}

export function saveReminderDismissed(isoDate: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(REMINDER_KEY, isoDate);
}

export function createTaskId() {
  return `t-${Math.random().toString(36).slice(2, 9)}`;
}

export function withUpdatedAt(task: Task, patch: Partial<Task>): Task {
  return { ...task, ...patch, updatedAt: new Date().toISOString() };
}

export function cycleStatus(status: TaskStatus): TaskStatus {
  if (status === "not_started") return "in_progress";
  if (status === "in_progress") return "done";
  return "not_started";
}

export function isOverdue(task: Task, today = toISODate()) {
  return task.status !== "done" && task.dueDate < today;
}
