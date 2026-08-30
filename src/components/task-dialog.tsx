"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Task, TaskHorizon, TaskPriority } from "@/lib/types";

type Draft = Pick<Task, "title" | "notes" | "horizon" | "priority" | "dueDate">;

export function TaskDialog({
  open,
  onOpenChange,
  task,
  today,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  today: string;
  onSave: (draft: Draft) => void;
}) {
  const [draft, setDraft] = useState<Draft>(
    task
      ? {
          title: task.title,
          notes: task.notes,
          horizon: task.horizon,
          priority: task.priority,
          dueDate: task.dueDate,
        }
      : {
          title: "",
          notes: "",
          horizon: "daily",
          priority: "medium",
          dueDate: today,
        },
  );

  function submit() {
    if (!draft.title.trim()) return;
    onSave({ ...draft, title: draft.title.trim() });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Kemaskini tugasan" : "Tugasan baru"}</DialogTitle>
          <DialogDescription>
            Tetapkan tarikh dan sama ada kerja ini harian, mingguan atau bulanan.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Field label="Tajuk">
            <Input
              value={draft.title}
              autoFocus
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Contoh: Hantar laporan mingguan"
            />
          </Field>
          <Field label="Nota">
            <Textarea
              value={draft.notes}
              onChange={(event) =>
                setDraft((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Hasil nampak, orang yang terlibat, atau fail yang perlu dibuka."
              rows={4}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tarikh siap">
              <Input
                type="date"
                value={draft.dueDate}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    dueDate: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Tempoh">
              <Select
                value={draft.horizon}
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    horizon: value as TaskHorizon,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Keutamaan">
            <Select
              value={draft.priority}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  priority: value as TaskPriority,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Utama</SelectItem>
                <SelectItem value="medium">Sederhana</SelectItem>
                <SelectItem value="low">Boleh tunggu</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" disabled={!draft.title.trim()}>
            Simpan
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
