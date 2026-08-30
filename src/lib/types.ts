export type TaskStatus = "not_started" | "in_progress" | "done";
export type TaskHorizon = "daily" | "weekly" | "monthly";
export type TaskPriority = "low" | "medium" | "high";
export type PeriodView = "today" | "week" | "month" | "all";
export type StatusFilter = "all" | TaskStatus | "overdue";

export type Task = {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  horizon: TaskHorizon;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  sourceEmailId?: string;
};

export type UnreadEmail = {
  id: string;
  mailbox: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  preview: string;
  receivedAt: string;
  unread: boolean;
};

export type Suggestion = {
  headline: string;
  timebox: string;
  why: string;
  steps: string[];
  nextAction: string;
};
