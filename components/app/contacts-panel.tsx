"use client";

import { useDeferredValue, useState } from "react";
import { Mail, Phone, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatLongDate } from "@/lib/formatters";
import { useAppStore } from "@/store/app-store";

type Filter = "all" | "tenant" | "client";

export function ContactsPanel() {
  const contacts = useAppStore((state) => state.contacts);
  const selectedContactId = useAppStore((state) => state.selectedContactId);
  const setSelectedContactId = useAppStore((state) => state.setSelectedContactId);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const deferredSearch = useDeferredValue(search);

  const filteredContacts = contacts.filter((contact) => {
    const matchesType = filter === "all" ? true : contact.kind === filter;
    const query = deferredSearch.trim().toLowerCase();
    const matchesQuery =
      query.length === 0
        ? true
        : `${contact.displayName} ${contact.label} ${contact.email} ${contact.phone}`.toLowerCase().includes(query);

    return matchesType && matchesQuery;
  });

  const selectedContact =
    filteredContacts.find((contact) => contact.id === selectedContactId) ?? filteredContacts[0] ?? contacts[0] ?? null;

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-border/70 bg-background/75">
        <CardHeader>
          <CardTitle>People</CardTitle>
          <CardDescription>Search by name, lease, business, phone, or email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search tenants or clients"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "tenant", "client"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                variant={filter === value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(value)}
              >
                {value === "all" ? "All" : value === "tenant" ? "Tenants" : "Clients"}
              </Button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => setSelectedContactId(contact.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedContact?.id === contact.id
                    ? "border-primary bg-primary/10"
                    : "border-border/70 bg-background/70 hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{contact.displayName}</p>
                    <p className="text-sm text-muted-foreground">{contact.label}</p>
                  </div>
                  <Badge variant={contact.kind === "tenant" ? "secondary" : "outline"}>
                    {contact.kind === "tenant" ? "Tenant" : "Client"}
                  </Badge>
                </div>
              </button>
            ))}
            {filteredContacts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                No contacts match that search yet.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/75">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{selectedContact?.displayName ?? "No contact selected"}</CardTitle>
              <CardDescription>{selectedContact?.label ?? "Pick a tenant or client to inspect the detail view."}</CardDescription>
            </div>
            {selectedContact ? (
              <Badge variant={selectedContact.kind === "tenant" ? "secondary" : "outline"}>
                {selectedContact.kind === "tenant" ? "Tenant" : "Client"}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedContact ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                  <p className="mt-2 font-medium">{selectedContact.email}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Phone
                  </div>
                  <p className="mt-2 font-medium">{selectedContact.phone}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="mt-2 leading-7">{selectedContact.notes}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-semibold">Payment history</h3>
                  <Badge variant="secondary">{selectedContact.paymentHistory.length} entries</Badge>
                </div>
                {selectedContact.paymentHistory.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{formatCurrency(entry.amount)}</p>
                        <p className="text-sm text-muted-foreground">{formatLongDate(entry.date)}</p>
                      </div>
                      <Badge
                        variant={
                          entry.status === "paid" ? "success" : entry.status === "overdue" ? "warning" : "secondary"
                        }
                      >
                        {entry.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{entry.note}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              Select a contact from the list to load the detail view.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
