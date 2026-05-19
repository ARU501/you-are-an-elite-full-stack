create type payment_status as enum ('due', 'overdue', 'pending', 'paid', 'failed');
create type payment_method_type as enum ('ach', 'card');

create table tenant_payment_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  stripe_customer_id text not null unique,
  autopay_enabled boolean not null default false,
  autopay_method payment_method_type,
  saved_payment_label text,
  notification_channels text[] not null default array['email'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table rent_payments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id),
  tenant_id uuid not null references tenants(id),
  label text not null,
  base_amount_cents integer not null,
  late_fee_cents integer not null default 0,
  paid_amount_cents integer,
  due_date date not null,
  status payment_status not null default 'due',
  payment_method payment_method_type,
  stripe_payment_intent_id text unique,
  receipt_number text unique,
  failure_reason text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payment_events (
  id uuid primary key default gen_random_uuid(),
  rent_payment_id uuid references rent_payments(id),
  stripe_event_id text unique,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
