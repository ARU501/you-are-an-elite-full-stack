"use client";

import { useState } from "react";
import { BellRing, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatLongDate } from "@/lib/formatters";
import { TaskDraft, TaskStatus } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function TasksPanel() {
  const mode = useAppStore((state) => state.mode);
  const properties = useAppStore((state) => state.properties);
  const jobs = useAppStore((state) => state.jobs);
  const tasks = useAppStore((state) => state.tasks);
  const lastPushAt = useAppStore((state) => state.lastPushAt);
  const addTask = useAppStore((state) => state.addTask);
  const updateTaskStatus = useAppStore((state) => state.updateTaskStatus);
  const simulatePush = useAppStore((state) => state.simulatePush);

  const recordOptions =
    mode === "landlord"
      ? properties.map((property) => ({ id: property.id, label: property.address }))
      : jobs.map((job) => ({ id: job.id, label: job.clientName }));
  const modeTasks = tasks.filter((task) => task.mode === mode);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>({
    title: "",
    detail: "",
    linkedRecordId: recordOptions[0]?.id,
    linkedName: recordOptions[0]?.label ?? "",
    priority: "medium",
    dueDate: new Date().toISOString().slice(0, 10),
    notifyByPush: true,
  });

  function openDialog() {
    setDraft({
      title: "",
      detail: "",
      linkedRecordId: recordOptions[0]?.id,
      linkedName: recordOptions[0]?.label ?? "",
      priority: "medium",
      dueDate: new Date().toISOString().slice(0, 10),
      notifyByPush: true,
    });
    setOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addTask(draft);
    toast.success("Task created.");
    setOpen(false);
  }

  function statusButton(taskId: string, currentStatus: TaskStatus, nextStatus: TaskStatus, label: string) {
    return (
      <Button
        variant={currentStatus === nextStatus ? "default" : "outline"}
        size="sm"
        onClick={() => {
          updateTaskStatus(taskId, nextStatus);
          toast.success(`Task moved to ${label}.`);
        }}
      >
        {label}
      </Button>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-semibold">
              {mode === "landlord" ? "Maintenance requests" : "Task board"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Create new requests, move them across statuses, and simulate the push notifications that keep people responsive.
            </p>
          </div>
          <Button onClick={openDialog}>
            <Plus className="h-4 w-4" />
            New task
          </Button>
        </div>

        <Card className="border-border/70 bg-background/75">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Push notifications simulation</p>
              <p className="mt-1 font-medium">{lastPushAt ? `Last triggered ${formatLongDate(lastPushAt)}` : "No push fired yet."}</p>
            </div>
            <Badge variant="secondary">MVP simulation</Badge>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {modeTasks.map((task) => (
            <Card key={task.id} className="border-border/70 bg-background/75">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-xl font-semibold">{task.title}</h3>
                      <Badge variant={task.status === "done" ? "success" : task.status === "open" ? "warning" : "secondary"}>
                        {task.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{task.detail}</p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Linked to {task.linkedName} • due {formatLongDate(task.dueDate)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    {task.notifyByPush ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          toast.success(simulatePush(task.id));
                        }}
                      >
                        <BellRing className="h-4 w-4" />
                        Simulate push
                      </Button>
                    ) : null}
                    <Badge variant={task.priority === "high" ? "warning" : task.priority === "medium" ? "secondary" : "outline"}>
                      {task.priority} priority
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusButton(task.id, task.status, "open", "Open")}
                  {statusButton(task.id, task.status, "in-progress", "In progress")}
                  {statusButton(task.id, task.status, "done", "Done")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a task</DialogTitle>
            <DialogDescription>Fast enough to use the moment something breaks or needs a callback.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="taskTitle">Title</Label>
              <Input
                id="taskTitle"
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskDetail">Detail</Label>
              <Textarea
                id="taskDetail"
                value={draft.detail}
                onChange={(event) => setDraft((current) => ({ ...current, detail: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="linkedRecord">Linked record</Label>
                <select
                  id="linkedRecord"
                  className={selectClassName}
                  value={draft.linkedRecordId}
                  onChange={(event) => {
                    const selected = recordOptions.find((option) => option.id === event.target.value);
                    setDraft((current) => ({
                      ...current,
                      linkedRecordId: event.target.value,
                      linkedName: selected?.label ?? "",
                    }));
                  }}
                >
                  {recordOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  className={selectClassName}
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      priority: event.target.value as TaskDraft["priority"],
                    }))
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taskDueDate">Due date</Label>
                <Input
                  id="taskDueDate"
                  type="date"
                  value={draft.dueDate}
                  onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  required
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/40 px-4 py-3">
                <div>
                  <p className="font-medium">Push alert</p>
                  <p className="text-sm text-muted-foreground">Simulate a mobile reminder</p>
                </div>
                <Switch
                  checked={draft.notifyByPush}
                  onCheckedChange={(checked) => setDraft((current) => ({ ...current, notifyByPush: checked }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
