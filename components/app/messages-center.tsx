"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import { getConversationMessages, getCurrentTenant, getCurrentProperty, getLandlordAccount, getTenantAccount } from "@/lib/role-data";
import { useAppStore } from "@/store/app-store";

export function MessagesCenter() {
  const data = useAppStore((state) => state);
  const currentUser = useAppStore((state) => state.currentUser);
  const selectedConversationTenantId = useAppStore((state) => state.selectedConversationTenantId);
  const setSelectedConversationTenantId = useAppStore((state) => state.setSelectedConversationTenantId);
  const markConversationRead = useAppStore((state) => state.markConversationRead);
  const sendMessage = useAppStore((state) => state.sendMessage);
  const broadcastMessage = useAppStore((state) => state.broadcastMessage);
  const [draft, setDraft] = useState("");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastDraft, setBroadcastDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const tenant = currentUser?.role === "tenant" ? getCurrentTenant(data) : undefined;
  const activeTenantId =
    currentUser?.role === "tenant" ? tenant?.id ?? null : selectedConversationTenantId ?? data.tenants[0]?.id ?? null;
  const activeTenant = activeTenantId ? data.tenants.find((entry) => entry.id === activeTenantId) : undefined;
  const activeProperty = currentUser?.role === "tenant" ? getCurrentProperty(data) : activeTenant ? data.properties.find((entry) => entry.id === activeTenant.propertyId) : undefined;
  const conversation = activeTenant ? getConversationMessages(data, activeTenant.id) : [];

  const tenantThreads = useMemo(
    () =>
      data.tenants
        .map((entry) => {
          const thread = getConversationMessages(data, entry.id);
          const unread = thread.filter((message) => message.to === currentUser?.id && !message.read).length;
          return {
            tenant: entry,
            lastMessage: thread[thread.length - 1],
            unread,
          };
        })
        .sort((a, b) => {
          const aTime = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
          const bTime = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
          return bTime - aTime;
        }),
    [currentUser?.id, data],
  );

  useEffect(() => {
    if (currentUser?.role === "landlord" && !selectedConversationTenantId && data.tenants[0]) {
      setSelectedConversationTenantId(data.tenants[0].id);
    }
  }, [currentUser?.role, data.tenants, selectedConversationTenantId, setSelectedConversationTenantId]);

  useEffect(() => {
    if (activeTenantId) {
      markConversationRead(activeTenantId);
    }
  }, [activeTenantId, markConversationRead]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [conversation.length]);

  function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = sendMessage(draft, activeTenantId ?? undefined);
    result.ok ? toast.success(result.message) : toast.error(result.message);
    if (result.ok) {
      setDraft("");
    }
  }

  function submitBroadcast(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = broadcastMessage(broadcastDraft);
    result.ok ? toast.success(result.message) : toast.error(result.message);
    if (result.ok) {
      setBroadcastDraft("");
      setBroadcastOpen(false);
    }
  }

  if (!currentUser || !activeTenant) {
    return null;
  }

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        {currentUser.role === "landlord" ? (
          <Card className="border-border/70 bg-background/75">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Inbox</CardTitle>
                  <CardDescription>Every tenant thread, last preview, and unread count in one place.</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setBroadcastOpen(true)}>
                  <Sparkles className="h-4 w-4" />
                  Broadcast
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {tenantThreads.map((thread) => (
                <button
                  key={thread.tenant.id}
                  type="button"
                  onClick={() => setSelectedConversationTenantId(thread.tenant.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    activeTenant.id === thread.tenant.id
                      ? "border-primary bg-primary/10"
                      : "border-border/70 bg-background/70 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{thread.tenant.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {thread.lastMessage?.content ?? "No messages yet"}
                      </p>
                    </div>
                    {thread.unread > 0 ? <Badge>{thread.unread}</Badge> : null}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{currentUser.role === "landlord" ? activeTenant.name : "Landlord"}</CardTitle>
                <CardDescription>
                  {activeProperty?.address} {activeProperty?.unitLabel}
                </CardDescription>
              </div>
              <Badge variant="secondary">{conversation.length} messages</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea ref={scrollRef} className="h-[54vh] rounded-3xl border border-border/70 bg-background/70 p-4">
              <div className="space-y-3">
                {conversation.map((message) => {
                  const isCurrentUser = message.from === currentUser.id;
                  return (
                    <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                          isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : "border border-border/70 bg-background text-foreground"
                        }`}
                      >
                        <p>{message.content}</p>
                        <div
                          className={`mt-2 flex items-center gap-2 text-[11px] ${
                            isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}
                        >
                          <span>{formatDateTime(message.timestamp)}</span>
                          {isCurrentUser ? <span>Sent</span> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <form className="space-y-3" onSubmit={submitMessage}>
              <div className="rounded-3xl border border-border/70 bg-background/70 p-3">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={
                    currentUser.role === "landlord"
                      ? `Reply to ${activeTenant.name}`
                      : "Send a message to your landlord"
                  }
                  className="min-h-[88px] border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit">
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>
            </form>

            {currentUser.role === "tenant" ? (
              <div className="rounded-3xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
                Landlord replies are persisted locally for the demo, so the thread stays alive across refreshes.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Broadcast to all tenants</DialogTitle>
            <DialogDescription>Send one update across every tenant inbox in the portfolio.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitBroadcast}>
            <Textarea
              value={broadcastDraft}
              onChange={(event) => setBroadcastDraft(event.target.value)}
              placeholder="Maintenance window tomorrow from 9 AM to noon. Please clear access to water shutoffs."
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBroadcastOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Send broadcast</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
