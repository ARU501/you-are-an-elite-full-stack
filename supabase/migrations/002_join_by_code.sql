-- =====================================================
-- LandlordForge - 002: Join a property by invite code
-- Run this AFTER 001 in the Supabase SQL editor.
-- Adds a landlord-generated, single-use invite code so a tenant can join a
-- property directly instead of submitting an application.
-- =====================================================

alter table public.properties add column if not exists invite_code text unique;

-- Landlord generates (or rotates) the invite code for one of their properties.
-- Returns the new code. Only the property owner may call it.
create or replace function public.generate_property_invite_code(p_property_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  prop record;
  new_code text;
begin
  select * into prop from public.properties where id = p_property_id;
  if prop.id is null then
    raise exception 'Property not found';
  end if;
  if prop.landlord_id <> auth.uid() then
    raise exception 'Only the property owner can create an invite code';
  end if;

  -- 8-char uppercase code, unique across all properties.
  loop
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from public.properties where invite_code = new_code);
  end loop;

  update public.properties set invite_code = new_code where id = p_property_id;
  return new_code;
end;
$$;

-- Tenant joins a property with a code from their landlord. Creates the tenancy
-- linked to the caller, marks the property occupied, generates the first rent
-- charge, and sends a welcome message — the same result as an approved
-- application. The code is single-use: it is cleared once someone joins.
create or replace function public.join_property_with_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me record;
  prop record;
  new_tenancy_id uuid;
  first_due date;
  rent_label text;
  display_name text;
begin
  select id, role, full_name, email, phone into me from public.profiles where id = auth.uid();
  if me.id is null then
    raise exception 'You must be signed in.';
  end if;
  if me.role <> 'tenant' then
    raise exception 'Only tenant accounts can join a property with a code.';
  end if;

  select * into prop from public.properties
  where invite_code is not null and upper(invite_code) = upper(trim(p_code));
  if prop.id is null then
    raise exception 'That code is not valid. Double-check it with your landlord.';
  end if;

  if exists (
    select 1 from public.tenancies
    where property_id = prop.id and tenant_profile_id = me.id and status = 'active'
  ) then
    raise exception 'You have already joined this property.';
  end if;

  display_name := coalesce(nullif(me.full_name, ''), me.email);

  insert into public.tenancies (landlord_id, property_id, tenant_profile_id, tenant_email, name, phone, lease_label, notes)
  values (
    prop.landlord_id,
    prop.id,
    me.id,
    me.email,
    display_name,
    coalesce(me.phone, ''),
    'Lease - ' || prop.address || case when prop.unit_label = '' then '' else ' ' || prop.unit_label end,
    ''
  )
  returning id into new_tenancy_id;

  -- Occupy the unit and consume the code (single use).
  update public.properties set status = 'occupied', invite_code = null where id = prop.id;

  first_due := date_trunc('month', now())::date + (prop.due_day - 1);
  if first_due < current_date then
    first_due := (date_trunc('month', now()) + interval '1 month')::date + (prop.due_day - 1);
  end if;
  rent_label := trim(to_char(first_due, 'FMMonth YYYY')) || ' Rent';

  insert into public.rent_payments (landlord_id, tenancy_id, property_id, label, base_amount_cents, due_date, status)
  values (prop.landlord_id, new_tenancy_id, prop.id, rent_label, prop.monthly_rent_cents, first_due, 'due');

  insert into public.messages (landlord_id, tenancy_id, sender_id, recipient_id, content)
  values (
    prop.landlord_id,
    new_tenancy_id,
    prop.landlord_id,
    me.id,
    'Welcome home! You joined ' || prop.address || '. Your lease and first rent charge are ready in the portal.'
  );

  insert into public.activities (landlord_id, tenancy_id, title, detail, type)
  values (
    prop.landlord_id,
    new_tenancy_id,
    'Tenant joined',
    display_name || ' joined ' || prop.address || ' with an invite code.',
    'property'
  );

  return new_tenancy_id;
end;
$$;
