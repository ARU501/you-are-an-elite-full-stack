-- =====================================================
-- LandlordForge - Production Schema
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- One project serves BOTH apps: the Landlord Portal
-- (LAND-LOARD branch) and the Tenant Portal (TENANT branch).
-- =====================================================

create extension if not exists "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('landlord', 'tenant')),
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  tier text not null default 'free' check (tier in ('free', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  address text not null,
  unit_label text not null default '',
  monthly_rent_cents integer not null check (monthly_rent_cents >= 0),
  due_day integer not null default 1 check (due_day between 1 and 28),
  note text not null default '',
  status text not null default 'occupied' check (status in ('occupied', 'attention', 'vacant')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A tenancy links a tenant to a property. tenant_profile_id stays null
-- until a tenant account with a matching email signs up (or the tenancy
-- is created by approving that tenant's application).
create table public.tenancies (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  tenant_profile_id uuid references public.profiles(id) on delete set null,
  tenant_email text not null default '',
  name text not null,
  phone text not null default '',
  lease_label text not null default '',
  notes text not null default '',
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rent_payments (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  tenancy_id uuid not null references public.tenancies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  label text not null,
  base_amount_cents integer not null check (base_amount_cents >= 0),
  late_fee_cents integer not null default 0,
  paid_amount_cents integer,
  due_date date not null,
  status text not null default 'due' check (status in ('due', 'overdue', 'pending', 'paid', 'failed')),
  payment_method text check (payment_method in ('ach', 'card')),
  stripe_payment_intent_id text,
  receipt_number text,
  failure_reason text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenancy_id, label)
);

create table public.payment_profiles (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  tenancy_id uuid not null unique references public.tenancies(id) on delete cascade,
  stripe_customer_id text not null default '',
  autopay_enabled boolean not null default false,
  autopay_method text check (autopay_method in ('ach', 'card')),
  saved_payment_label text,
  notification_channels text[] not null default array['email'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_events (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid references public.profiles(id) on delete cascade,
  rent_payment_id uuid references public.rent_payments(id) on delete set null,
  stripe_event_id text unique,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.maintenance_requests (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  tenancy_id uuid not null references public.tenancies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  detail text not null default '',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'in-progress', 'done')),
  due_date date,
  source text not null default 'tenant' check (source in ('landlord', 'tenant')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  category text not null default 'General',
  amount_cents integer not null check (amount_cents >= 0),
  incurred_on date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  tenancy_id uuid not null references public.tenancies(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  tenancy_id uuid references public.tenancies(id) on delete cascade,
  title text not null,
  detail text not null default '',
  type text not null default 'system' check (type in ('payment', 'request', 'expense', 'message', 'property', 'auth', 'system')),
  created_at timestamptz not null default now()
);

create table public.rental_applications (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  applicant_profile_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null default '',
  move_in text not null default '',
  income text not null default '',
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

create index idx_properties_landlord on public.properties(landlord_id);
create index idx_tenancies_landlord on public.tenancies(landlord_id);
create index idx_tenancies_tenant on public.tenancies(tenant_profile_id);
create index idx_rent_payments_tenancy on public.rent_payments(tenancy_id);
create index idx_rent_payments_landlord on public.rent_payments(landlord_id);
create index idx_rent_payments_intent on public.rent_payments(stripe_payment_intent_id);
create index idx_messages_landlord on public.messages(landlord_id);
create index idx_messages_tenancy on public.messages(tenancy_id);
create index idx_requests_landlord on public.maintenance_requests(landlord_id);
create index idx_activities_landlord on public.activities(landlord_id);
create index idx_applications_landlord on public.rental_applications(landlord_id);

-- =====================================================
-- HELPERS
-- =====================================================

-- True when the current user is the tenant on the given tenancy.
create or replace function public.is_my_tenancy(t_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.tenancies
    where id = t_id and tenant_profile_id = auth.uid()
  );
$$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.tenancies enable row level security;
alter table public.rent_payments enable row level security;
alter table public.payment_profiles enable row level security;
alter table public.payment_events enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.expenses enable row level security;
alter table public.messages enable row level security;
alter table public.activities enable row level security;
alter table public.rental_applications enable row level security;

-- PROFILES
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_select_my_tenants" on public.profiles
  for select using (
    exists (
      select 1 from public.tenancies
      where tenancies.tenant_profile_id = profiles.id
        and tenancies.landlord_id = auth.uid()
    )
  );
create policy "profiles_select_my_landlord" on public.profiles
  for select using (
    exists (
      select 1 from public.tenancies
      where tenancies.landlord_id = profiles.id
        and tenancies.tenant_profile_id = auth.uid()
    )
  );
create policy "profiles_select_my_applicants" on public.profiles
  for select using (
    exists (
      select 1 from public.rental_applications
      where rental_applications.applicant_profile_id = profiles.id
        and rental_applications.landlord_id = auth.uid()
    )
  );

-- PROPERTIES
create policy "properties_landlord_all" on public.properties
  for all using (auth.uid() = landlord_id) with check (auth.uid() = landlord_id);
create policy "properties_tenant_select" on public.properties
  for select using (
    exists (
      select 1 from public.tenancies
      where tenancies.property_id = properties.id
        and tenancies.tenant_profile_id = auth.uid()
    )
  );
-- Vacant units are browsable by any signed-in user (tenant Browse page).
create policy "properties_browse_vacant" on public.properties
  for select using (status = 'vacant' and auth.uid() is not null);

-- TENANCIES
create policy "tenancies_landlord_all" on public.tenancies
  for all using (auth.uid() = landlord_id) with check (auth.uid() = landlord_id);
create policy "tenancies_tenant_select" on public.tenancies
  for select using (auth.uid() = tenant_profile_id);

-- RENT PAYMENTS
create policy "payments_landlord_all" on public.rent_payments
  for all using (auth.uid() = landlord_id) with check (auth.uid() = landlord_id);
create policy "payments_tenant_select" on public.rent_payments
  for select using (public.is_my_tenancy(tenancy_id));
create policy "payments_tenant_update" on public.rent_payments
  for update using (public.is_my_tenancy(tenancy_id));

-- PAYMENT PROFILES
create policy "payment_profiles_landlord_select" on public.payment_profiles
  for select using (auth.uid() = landlord_id);
create policy "payment_profiles_tenant_all" on public.payment_profiles
  for all using (public.is_my_tenancy(tenancy_id)) with check (public.is_my_tenancy(tenancy_id));

-- PAYMENT EVENTS
create policy "payment_events_landlord_select" on public.payment_events
  for select using (auth.uid() = landlord_id);
create policy "payment_events_insert_participant" on public.payment_events
  for insert with check (
    auth.uid() = landlord_id
    or exists (
      select 1 from public.rent_payments
      where rent_payments.id = payment_events.rent_payment_id
        and public.is_my_tenancy(rent_payments.tenancy_id)
    )
  );
create policy "payment_events_tenant_select" on public.payment_events
  for select using (
    exists (
      select 1 from public.rent_payments
      where rent_payments.id = payment_events.rent_payment_id
        and public.is_my_tenancy(rent_payments.tenancy_id)
    )
  );

-- MAINTENANCE REQUESTS
create policy "requests_landlord_all" on public.maintenance_requests
  for all using (auth.uid() = landlord_id) with check (auth.uid() = landlord_id);
create policy "requests_tenant_select" on public.maintenance_requests
  for select using (public.is_my_tenancy(tenancy_id));
create policy "requests_tenant_insert" on public.maintenance_requests
  for insert with check (public.is_my_tenancy(tenancy_id) and source = 'tenant');

-- EXPENSES
create policy "expenses_landlord_all" on public.expenses
  for all using (auth.uid() = landlord_id) with check (auth.uid() = landlord_id);

-- MESSAGES
create policy "messages_select_participant" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "messages_insert_participant" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and (auth.uid() = landlord_id or public.is_my_tenancy(tenancy_id))
  );
create policy "messages_update_recipient" on public.messages
  for update using (auth.uid() = recipient_id);

-- ACTIVITIES
create policy "activities_landlord_all" on public.activities
  for all using (auth.uid() = landlord_id) with check (auth.uid() = landlord_id);
create policy "activities_tenant_select" on public.activities
  for select using (tenancy_id is not null and public.is_my_tenancy(tenancy_id));
create policy "activities_tenant_insert" on public.activities
  for insert with check (tenancy_id is not null and public.is_my_tenancy(tenancy_id));

-- RENTAL APPLICATIONS
create policy "applications_landlord_select" on public.rental_applications
  for select using (auth.uid() = landlord_id);
create policy "applications_landlord_update" on public.rental_applications
  for update using (auth.uid() = landlord_id);
create policy "applications_applicant_select" on public.rental_applications
  for select using (auth.uid() = applicant_profile_id);
create policy "applications_applicant_insert" on public.rental_applications
  for insert with check (auth.uid() = applicant_profile_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Create a profile row for every new auth user and claim any tenancies
-- that were set up ahead of time with this email address.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'tenant'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;

  if coalesce(new.raw_user_meta_data->>'role', 'tenant') = 'tenant' then
    update public.tenancies
    set tenant_profile_id = new.id
    where tenant_profile_id is null
      and lower(tenant_email) = lower(coalesce(new.email, ''));
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();
create trigger update_properties_updated_at before update on public.properties
  for each row execute function public.update_updated_at_column();
create trigger update_tenancies_updated_at before update on public.tenancies
  for each row execute function public.update_updated_at_column();
create trigger update_payment_profiles_updated_at before update on public.payment_profiles
  for each row execute function public.update_updated_at_column();
create trigger update_requests_updated_at before update on public.maintenance_requests
  for each row execute function public.update_updated_at_column();

-- =====================================================
-- RPCS (called by the apps)
-- =====================================================

-- Link tenancies to the calling user by email. Idempotent; called on
-- every workspace load so invited tenants get connected automatically.
create or replace function public.claim_my_tenancies()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  my_email text;
  my_role text;
begin
  select email, role into my_email, my_role from public.profiles where id = auth.uid();
  if my_email is null or my_email = '' or my_role <> 'tenant' then
    return;
  end if;

  update public.tenancies
  set tenant_profile_id = auth.uid()
  where tenant_profile_id is null
    and lower(tenant_email) = lower(my_email);
end;
$$;

-- Generate the current month's rent charge for every active tenancy the
-- caller can see, and roll 'due' charges past their due date to 'overdue'.
-- Idempotent; called on every workspace load.
create or replace function public.ensure_rent_payments()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.rent_payments (landlord_id, tenancy_id, property_id, label, base_amount_cents, due_date, status)
  select
    t.landlord_id,
    t.id,
    t.property_id,
    trim(to_char(now(), 'FMMonth YYYY')) || ' Rent',
    p.monthly_rent_cents,
    (date_trunc('month', now())::date + (p.due_day - 1)),
    case when (date_trunc('month', now())::date + (p.due_day - 1)) < current_date then 'overdue' else 'due' end
  from public.tenancies t
  join public.properties p on p.id = t.property_id
  where t.status = 'active'
    and (t.landlord_id = auth.uid() or t.tenant_profile_id = auth.uid())
    and not exists (
      select 1 from public.rent_payments rp
      where rp.tenancy_id = t.id
        and rp.label = trim(to_char(now(), 'FMMonth YYYY')) || ' Rent'
    );

  update public.rent_payments
  set status = 'overdue'
  where status = 'due'
    and due_date < current_date
    and (landlord_id = auth.uid() or public.is_my_tenancy(tenancy_id));
end;
$$;

-- Approve a rental application atomically: mark it approved, create the
-- tenancy linked to the applicant, mark the property occupied, generate
-- the first rent charge, and send a welcome message.
create or replace function public.approve_application(application_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  app record;
  prop record;
  new_tenancy_id uuid;
  first_due date;
  rent_label text;
begin
  select * into app from public.rental_applications where id = application_id;
  if app is null then
    raise exception 'Application not found';
  end if;
  if app.landlord_id <> auth.uid() then
    raise exception 'Only the property landlord can approve this application';
  end if;
  if app.status <> 'pending' then
    raise exception 'Application was already decided';
  end if;

  select * into prop from public.properties where id = app.property_id;

  update public.rental_applications set status = 'approved' where id = application_id;

  insert into public.tenancies (landlord_id, property_id, tenant_profile_id, tenant_email, name, phone, lease_label, notes)
  values (
    app.landlord_id,
    app.property_id,
    app.applicant_profile_id,
    app.email,
    app.full_name,
    app.phone,
    'Lease - ' || prop.address || case when prop.unit_label = '' then '' else ' ' || prop.unit_label end,
    app.message
  )
  returning id into new_tenancy_id;

  update public.properties set status = 'occupied' where id = app.property_id;

  first_due := date_trunc('month', now())::date + (prop.due_day - 1);
  if first_due < current_date then
    first_due := (date_trunc('month', now()) + interval '1 month')::date + (prop.due_day - 1);
  end if;
  rent_label := trim(to_char(first_due, 'FMMonth YYYY')) || ' Rent';

  insert into public.rent_payments (landlord_id, tenancy_id, property_id, label, base_amount_cents, due_date, status)
  values (app.landlord_id, new_tenancy_id, app.property_id, rent_label, prop.monthly_rent_cents, first_due, 'due');

  insert into public.messages (landlord_id, tenancy_id, sender_id, recipient_id, content)
  values (
    app.landlord_id,
    new_tenancy_id,
    app.landlord_id,
    app.applicant_profile_id,
    'Welcome home! Your application for ' || prop.address || ' was approved. Your lease and first rent charge are ready in the portal.'
  );

  insert into public.activities (landlord_id, tenancy_id, title, detail, type)
  values (
    app.landlord_id,
    new_tenancy_id,
    'Application approved',
    app.full_name || ' was approved for ' || prop.address || ' and added to the tenant roster.',
    'property'
  );

  return new_tenancy_id;
end;
$$;

-- =====================================================
-- REALTIME
-- =====================================================

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.rent_payments;
alter publication supabase_realtime add table public.maintenance_requests;
alter publication supabase_realtime add table public.rental_applications;
