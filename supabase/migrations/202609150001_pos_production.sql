-- Kasir Digital production schema
-- Isolated with the pos_ prefix because this Supabase project also hosts another app.

create table public.pos_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  role text check (role in ('owner', 'cashier', 'kitchen')),
  active boolean not null default false,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id)
);

create table public.pos_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.pos_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.pos_categories(id) on delete set null,
  name text not null unique check (char_length(name) between 1 and 120),
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  track_stock boolean not null default true,
  sold_out boolean not null default false,
  active boolean not null default true,
  image_url text,
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pos_tables (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Za-z0-9-]{1,10}$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.pos_shifts (
  id uuid primary key default gen_random_uuid(),
  cashier_id uuid not null references auth.users(id),
  cashier_name text not null check (char_length(cashier_name) between 2 and 80),
  opening_cash integer not null check (opening_cash >= 0),
  expected_cash integer,
  actual_cash integer check (actual_cash >= 0),
  difference integer,
  status text not null default 'open' check (status in ('open', 'closed')),
  notes text check (notes is null or char_length(notes) <= 500),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create unique index pos_one_open_shift_idx
  on public.pos_shifts ((true))
  where status = 'open';

create table public.pos_orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  client_token uuid not null unique,
  public_token uuid not null default gen_random_uuid() unique,
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  table_code text check (table_code is null or table_code ~ '^[A-Za-z0-9-]{1,10}$'),
  shift_id uuid not null references public.pos_shifts(id),
  status text not null default 'pending'
    check (status in ('pending', 'cooking', 'ready', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded', 'voided')),
  total integer not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ready_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
);

create index pos_orders_queue_idx
  on public.pos_orders (status, created_at);
create index pos_orders_payment_idx
  on public.pos_orders (payment_status, created_at desc);
create index pos_orders_shift_idx
  on public.pos_orders (shift_id);

create table public.pos_order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.pos_orders(id) on delete restrict,
  product_id uuid references public.pos_products(id) on delete set null,
  product_name text not null,
  options jsonb not null default '{}'::jsonb check (jsonb_typeof(options) = 'object'),
  quantity integer not null check (quantity between 1 and 99),
  unit_price integer not null check (unit_price >= 0),
  subtotal integer generated always as (quantity * unit_price) stored
);

create index pos_order_items_order_idx
  on public.pos_order_items (order_id);

create table public.pos_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.pos_orders(id) on delete restrict,
  shift_id uuid not null references public.pos_shifts(id),
  kind text not null check (kind in ('sale', 'refund')),
  method text not null check (method in ('cash', 'qris')),
  amount integer not null check (amount > 0),
  tendered integer check (tendered is null or tendered >= 0),
  change_amount integer not null default 0 check (change_amount >= 0),
  idempotency_key uuid not null unique,
  processed_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create unique index pos_one_sale_per_order_idx
  on public.pos_payments (order_id)
  where kind = 'sale';
create unique index pos_one_refund_per_order_idx
  on public.pos_payments (order_id)
  where kind = 'refund';
create index pos_payments_shift_idx
  on public.pos_payments (shift_id, created_at);

create table public.pos_stock_movements (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.pos_products(id) on delete restrict,
  order_id uuid references public.pos_orders(id) on delete restrict,
  quantity_delta integer not null check (quantity_delta <> 0),
  reason text not null check (reason in ('sale', 'void', 'refund', 'adjustment')),
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index pos_stock_movements_product_idx
  on public.pos_stock_movements (product_id, created_at desc);

create table public.pos_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null check (char_length(action) between 2 and 80),
  entity_type text not null check (char_length(entity_type) between 2 and 50),
  entity_id text,
  reason text check (reason is null or char_length(reason) <= 500),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index pos_audit_logs_created_idx
  on public.pos_audit_logs (created_at desc);

create table public.pos_settings (
  id boolean primary key default true check (id),
  business_name text not null default 'Kasir Digital'
    check (char_length(business_name) between 2 and 100),
  currency text not null default 'IDR' check (currency = 'IDR'),
  qris_image_url text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.pos_settings (id) values (true);

create or replace function public.pos_valid_product_options(p_options jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_group jsonb;
  v_value jsonb;
  v_name text;
  v_text text;
  v_names text[] := array[]::text[];
  v_values text[];
begin
  if p_options is null
     or jsonb_typeof(p_options) is distinct from 'array'
     or jsonb_array_length(p_options) > 10 then
    return false;
  end if;

  for v_group in select value from jsonb_array_elements(p_options)
  loop
    if jsonb_typeof(v_group) is distinct from 'object'
       or jsonb_typeof(v_group->'name') is distinct from 'string'
       or jsonb_typeof(v_group->'values') is distinct from 'array' then
      return false;
    end if;

    v_name := btrim(v_group->>'name');
    if char_length(v_name) not between 1 and 40
       or v_name <> v_group->>'name'
       or v_name = any(v_names)
       or jsonb_array_length(v_group->'values') not between 1 and 20 then
      return false;
    end if;
    v_names := array_append(v_names, v_name);
    v_values := array[]::text[];

    for v_value in select value from jsonb_array_elements(v_group->'values')
    loop
      if jsonb_typeof(v_value) is distinct from 'string' then
        return false;
      end if;
      v_text := btrim(v_value #>> '{}');
      if char_length(v_text) not between 1 and 80
         or v_text <> (v_value #>> '{}')
         or v_text = any(v_values) then
        return false;
      end if;
      v_values := array_append(v_values, v_text);
    end loop;
  end loop;

  return true;
end
$$;

create or replace function public.pos_options_match(
  p_config jsonb,
  p_selected jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_group jsonb;
  v_name text;
  v_selected text;
  v_selected_count integer;
begin
  if not public.pos_valid_product_options(p_config)
     or p_selected is null
     or jsonb_typeof(p_selected) is distinct from 'object' then
    return false;
  end if;

  select count(*)::integer into v_selected_count
  from jsonb_object_keys(p_selected);

  if v_selected_count <> jsonb_array_length(p_config) then
    return false;
  end if;

  for v_group in select value from jsonb_array_elements(p_config)
  loop
    v_name := v_group->>'name';
    if jsonb_typeof(p_selected->v_name) is distinct from 'string' then
      return false;
    end if;

    v_selected := p_selected->>v_name;
    if not exists (
      select 1
      from jsonb_array_elements_text(v_group->'values') as allowed(value)
      where allowed.value = v_selected
    ) then
      return false;
    end if;
  end loop;

  return true;
end
$$;

create or replace function public.pos_current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.pos_staff
  where user_id = (select auth.uid())
    and active = true
$$;

create or replace function public.pos_has_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.pos_current_role() = any(allowed_roles), false)
$$;

create or replace function public.pos_bootstrap_status()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'has_owner',
    exists (
      select 1 from public.pos_staff
      where role = 'owner' and active = true
    )
  )
$$;

create or replace function public.pos_request_access(p_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_name text := btrim(coalesce(p_display_name, ''));
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if char_length(v_name) not between 2 and 80 then
    raise exception 'Nama harus 2-80 karakter' using errcode = '22023';
  end if;

  insert into public.pos_staff (user_id, display_name)
  values (v_user, v_name)
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        requested_at = now()
    where public.pos_staff.active = false;

  return jsonb_build_object('success', true);
end
$$;

create or replace function public.pos_claim_first_owner(p_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_name text := btrim(coalesce(p_display_name, ''));
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if char_length(v_name) not between 2 and 80 then
    raise exception 'Nama harus 2-80 karakter' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('pos_owner_roster'));

  if exists (
    select 1 from public.pos_staff
    where role = 'owner' and active = true
  ) then
    raise exception 'Owner POS sudah tersedia' using errcode = '23505';
  end if;

  insert into public.pos_staff (
    user_id, display_name, role, active, approved_at, approved_by
  )
  values (v_user, v_name, 'owner', true, now(), v_user)
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        role = 'owner',
        active = true,
        approved_at = now(),
        approved_by = v_user;

  insert into public.pos_audit_logs (
    actor_id, action, entity_type, entity_id
  ) values (
    v_user, 'owner_bootstrapped', 'staff', v_user::text
  );

  return jsonb_build_object('success', true, 'role', 'owner');
end
$$;

create or replace function public.pos_set_staff_access(
  p_user_id uuid,
  p_role text,
  p_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_target public.pos_staff;
begin
  if not public.pos_has_role(array['owner']) then
    raise exception 'Owner access required' using errcode = '42501';
  end if;
  if p_user_id is null
     or p_active is null
     or p_role is null
     or p_role not in ('owner', 'cashier', 'kitchen') then
    raise exception 'Invalid staff access request' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('pos_owner_roster'));

  select * into v_target
  from public.pos_staff
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Staff request not found' using errcode = 'P0002';
  end if;
  if p_user_id = v_actor
     and (p_active is distinct from true or p_role <> 'owner') then
    raise exception 'Owner tidak dapat menurunkan akses akun sendiri' using errcode = '22023';
  end if;
  if v_target.active
     and v_target.role = 'owner'
     and (p_active is distinct from true or p_role <> 'owner')
     and not exists (
       select 1 from public.pos_staff
       where role = 'owner'
         and active = true
         and user_id <> p_user_id
     ) then
    raise exception 'Minimal satu owner aktif harus dipertahankan' using errcode = '23505';
  end if;

  update public.pos_staff
  set role = p_role,
      active = p_active,
      approved_at = case when p_active then now() else approved_at end,
      approved_by = v_actor
  where user_id = p_user_id;

  insert into public.pos_audit_logs (
    actor_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor,
    'staff_access_changed',
    'staff',
    p_user_id::text,
    jsonb_build_object('role', p_role, 'active', p_active)
  );

  return jsonb_build_object('success', true);
end
$$;

create or replace function public.pos_open_shift(
  p_opening_cash integer
)
returns public.pos_shifts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_name text;
  v_shift public.pos_shifts;
begin
  if not public.pos_has_role(array['owner', 'cashier']) then
    raise exception 'Cashier access required' using errcode = '42501';
  end if;
  if p_opening_cash is null or p_opening_cash < 0 then
    raise exception 'Invalid opening cash' using errcode = '22023';
  end if;

  select display_name into v_name
  from public.pos_staff
  where user_id = v_user and active = true;

  begin
    insert into public.pos_shifts (
      cashier_id, cashier_name, opening_cash
    ) values (
      v_user, v_name, p_opening_cash
    ) returning * into v_shift;
  exception when unique_violation then
    raise exception 'Masih ada shift aktif' using errcode = '23505';
  end;

  insert into public.pos_audit_logs (
    actor_id, action, entity_type, entity_id,
    metadata
  ) values (
    v_user, 'shift_opened', 'shift', v_shift.id::text,
    jsonb_build_object('opening_cash', p_opening_cash)
  );

  return v_shift;
end
$$;

create or replace function public.pos_create_order(
  p_customer_name text,
  p_table_code text,
  p_items jsonb,
  p_client_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shift public.pos_shifts;
  v_order public.pos_orders;
  v_existing public.pos_orders;
  v_item jsonb;
  v_product public.pos_products;
  v_product_id uuid;
  v_qty integer;
  v_options jsonb;
  v_total bigint := 0;
  v_name text := left(btrim(coalesce(p_customer_name, 'Tamu')), 80);
  v_table text := nullif(upper(btrim(coalesce(p_table_code, ''))), '');
begin
  if p_client_token is null then
    raise exception 'Client token required' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'pos_order:' || p_client_token::text,
      0
    )
  );

  select * into v_existing
  from public.pos_orders
  where client_token = p_client_token;

  if found then
    return jsonb_build_object(
      'id', v_existing.id,
      'order_number', v_existing.order_number,
      'public_token', v_existing.public_token,
      'status', v_existing.status,
      'total', v_existing.total
    );
  end if;

  if v_name = '' then v_name := 'Tamu'; end if;
  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1
     or jsonb_array_length(p_items) > 50 then
    raise exception 'Order harus berisi 1-50 item' using errcode = '22023';
  end if;

  select * into v_shift
  from public.pos_shifts
  where status = 'open'
  limit 1
  for update;

  if not found then
    raise exception 'Kasir belum membuka shift' using errcode = 'P0001';
  end if;

  if v_table is not null and not exists (
    select 1 from public.pos_tables
    where code = v_table and active = true
  ) then
    raise exception 'Nomor meja tidak valid' using errcode = '22023';
  end if;

  insert into public.pos_orders (
    client_token, customer_name, table_code, shift_id
  ) values (
    p_client_token, v_name, v_table, v_shift.id
  ) returning * into v_order;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    begin
      v_product_id := (v_item->>'product_id')::uuid;
      v_qty := (v_item->>'quantity')::integer;
    exception when others then
      raise exception 'Format item tidak valid' using errcode = '22023';
    end;

    if v_qty not between 1 and 99 then
      raise exception 'Jumlah item harus 1-99' using errcode = '22023';
    end if;

    v_options := coalesce(v_item->'options', '{}'::jsonb);
    if jsonb_typeof(v_options) <> 'object' then
      raise exception 'Pilihan item tidak valid' using errcode = '22023';
    end if;

    select * into v_product
    from public.pos_products
    where id = v_product_id and active = true
    for update;

    if not found or v_product.sold_out then
      raise exception 'Produk tidak tersedia' using errcode = 'P0001';
    end if;
    if not public.pos_options_match(v_product.options, v_options) then
      raise exception 'Pilihan produk tidak valid' using errcode = '22023';
    end if;
    if v_product.track_stock and v_product.stock < v_qty then
      raise exception 'Stok % tidak cukup', v_product.name using errcode = 'P0001';
    end if;

    insert into public.pos_order_items (
      order_id, product_id, product_name, options,
      quantity, unit_price
    ) values (
      v_order.id, v_product.id, v_product.name, v_options,
      v_qty, v_product.price
    );

    v_total := v_total + (v_product.price::bigint * v_qty);
    if v_total > 2147483647 then
      raise exception 'Nilai order melebihi batas' using errcode = '22003';
    end if;

    if v_product.track_stock then
      update public.pos_products
      set stock = stock - v_qty,
          sold_out = (stock - v_qty <= 0),
          updated_at = now()
      where id = v_product.id;

      insert into public.pos_stock_movements (
        product_id, order_id, quantity_delta, reason
      ) values (
        v_product.id, v_order.id, -v_qty, 'sale'
      );
    end if;
  end loop;

  update public.pos_orders
  set total = v_total::integer, updated_at = now()
  where id = v_order.id
  returning * into v_order;

  insert into public.pos_audit_logs (
    action, entity_type, entity_id, metadata
  ) values (
    'order_created', 'order', v_order.id::text,
    jsonb_build_object('order_number', v_order.order_number, 'total', v_total)
  );

  return jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'public_token', v_order.public_token,
    'status', v_order.status,
    'total', v_order.total
  );
end
$$;

create or replace function public.pos_get_order_status(
  p_order_id uuid,
  p_public_token uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'table_code', o.table_code,
    'status', o.status,
    'payment_status', o.payment_status,
    'total', o.total,
    'created_at', o.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', i.product_name,
        'quantity', i.quantity,
        'options', i.options
      ) order by i.id)
      from public.pos_order_items i
      where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.pos_orders o
  where o.id = p_order_id
    and o.public_token = p_public_token
$$;

create or replace function public.pos_update_order_status(
  p_order_id uuid,
  p_status text
)
returns public.pos_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_order public.pos_orders;
begin
  if not public.pos_has_role(array['owner', 'kitchen']) then
    raise exception 'Kitchen access required' using errcode = '42501';
  end if;

  select * into v_order
  from public.pos_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;
  if not (
    (v_order.status = 'pending' and p_status = 'cooking')
    or (v_order.status = 'cooking' and p_status = 'ready')
  ) then
    raise exception 'Invalid order status transition' using errcode = '22023';
  end if;

  update public.pos_orders
  set status = p_status,
      ready_at = case when p_status = 'ready' then now() else ready_at end,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  insert into public.pos_audit_logs (
    actor_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor, 'order_status_changed', 'order', p_order_id::text,
    jsonb_build_object('status', p_status)
  );

  return v_order;
end
$$;

create or replace function public.pos_pay_order(
  p_order_id uuid,
  p_method text,
  p_tendered integer,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_order public.pos_orders;
  v_payment public.pos_payments;
  v_tendered integer;
begin
  if not public.pos_has_role(array['owner', 'cashier']) then
    raise exception 'Cashier access required' using errcode = '42501';
  end if;
  if p_method not in ('cash', 'qris') or p_idempotency_key is null then
    raise exception 'Invalid payment request' using errcode = '22023';
  end if;

  select * into v_payment
  from public.pos_payments
  where idempotency_key = p_idempotency_key;

  if found then
    if v_payment.kind <> 'sale'
       or v_payment.order_id <> p_order_id then
      raise exception 'Idempotency key digunakan untuk transaksi lain' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'success', true,
      'payment_id', v_payment.id,
      'order_id', v_payment.order_id,
      'amount', v_payment.amount,
      'change_amount', v_payment.change_amount
    );
  end if;

  select * into v_order
  from public.pos_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  select * into v_payment
  from public.pos_payments
  where idempotency_key = p_idempotency_key;

  if found then
    if v_payment.kind <> 'sale'
       or v_payment.order_id <> p_order_id then
      raise exception 'Idempotency key digunakan untuk transaksi lain' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'success', true,
      'payment_id', v_payment.id,
      'order_id', v_payment.order_id,
      'amount', v_payment.amount,
      'change_amount', v_payment.change_amount
    );
  end if;

  if v_order.status <> 'ready' or v_order.payment_status <> 'unpaid' then
    raise exception 'Order tidak siap atau sudah dibayar' using errcode = '23505';
  end if;
  if not exists (
    select 1 from public.pos_shifts
    where id = v_order.shift_id and status = 'open'
  ) then
    raise exception 'Shift order sudah ditutup' using errcode = 'P0001';
  end if;

  v_tendered := case
    when p_method = 'qris' then v_order.total
    else p_tendered
  end;

  if v_tendered is null or v_tendered < v_order.total then
    raise exception 'Nominal pembayaran kurang' using errcode = '22023';
  end if;

  insert into public.pos_payments (
    order_id, shift_id, kind, method, amount,
    tendered, change_amount, idempotency_key, processed_by
  ) values (
    v_order.id, v_order.shift_id, 'sale', p_method, v_order.total,
    v_tendered, v_tendered - v_order.total, p_idempotency_key, v_actor
  ) returning * into v_payment;

  update public.pos_orders
  set status = 'completed',
      payment_status = 'paid',
      completed_at = now(),
      updated_at = now()
  where id = v_order.id;

  insert into public.pos_audit_logs (
    actor_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor, 'payment_completed', 'order', v_order.id::text,
    jsonb_build_object(
      'payment_id', v_payment.id,
      'method', p_method,
      'amount', v_order.total
    )
  );

  return jsonb_build_object(
    'success', true,
    'payment_id', v_payment.id,
    'order_id', v_order.id,
    'amount', v_order.total,
    'tendered', v_tendered,
    'change_amount', v_tendered - v_order.total
  );
end
$$;

create or replace function public.pos_void_order(
  p_order_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_order public.pos_orders;
  v_item record;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if not public.pos_has_role(array['owner', 'cashier']) then
    raise exception 'Cashier access required' using errcode = '42501';
  end if;
  if char_length(v_reason) < 3 or char_length(v_reason) > 500 then
    raise exception 'Alasan void harus 3-500 karakter' using errcode = '22023';
  end if;

  select * into v_order
  from public.pos_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;
  if v_order.payment_status <> 'unpaid'
     or v_order.status in ('completed', 'cancelled') then
    raise exception 'Order tidak dapat di-void' using errcode = '23505';
  end if;

  for v_item in
    select i.product_id, i.quantity, p.track_stock
    from public.pos_order_items i
    join public.pos_products p on p.id = i.product_id
    where i.order_id = p_order_id
    for update of p
  loop
    if v_item.track_stock then
      update public.pos_products
      set stock = stock + v_item.quantity,
          sold_out = false,
          updated_at = now()
      where id = v_item.product_id;

      insert into public.pos_stock_movements (
        product_id, order_id, quantity_delta, reason, actor_id
      ) values (
        v_item.product_id, p_order_id, v_item.quantity, 'void', v_actor
      );
    end if;
  end loop;

  update public.pos_orders
  set status = 'cancelled',
      payment_status = 'voided',
      cancelled_at = now(),
      updated_at = now()
  where id = p_order_id;

  insert into public.pos_audit_logs (
    actor_id, action, entity_type, entity_id, reason
  ) values (
    v_actor, 'order_voided', 'order', p_order_id::text, v_reason
  );

  return jsonb_build_object('success', true);
end
$$;

create or replace function public.pos_refund_order(
  p_order_id uuid,
  p_reason text,
  p_restock boolean,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_order public.pos_orders;
  v_sale public.pos_payments;
  v_refund public.pos_payments;
  v_shift public.pos_shifts;
  v_item record;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if not public.pos_has_role(array['owner']) then
    raise exception 'Owner access required' using errcode = '42501';
  end if;
  if char_length(v_reason) < 3 or char_length(v_reason) > 500
     or p_idempotency_key is null then
    raise exception 'Invalid refund request' using errcode = '22023';
  end if;

  select * into v_refund
  from public.pos_payments
  where idempotency_key = p_idempotency_key;
  if found then
    if v_refund.kind <> 'refund'
       or v_refund.order_id <> p_order_id then
      raise exception 'Idempotency key digunakan untuk transaksi lain' using errcode = '23505';
    end if;
    return jsonb_build_object('success', true, 'payment_id', v_refund.id);
  end if;

  select * into v_order
  from public.pos_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  select * into v_refund
  from public.pos_payments
  where idempotency_key = p_idempotency_key;

  if found then
    if v_refund.kind <> 'refund'
       or v_refund.order_id <> p_order_id then
      raise exception 'Idempotency key digunakan untuk transaksi lain' using errcode = '23505';
    end if;
    return jsonb_build_object('success', true, 'payment_id', v_refund.id);
  end if;

  if v_order.payment_status <> 'paid' then
    raise exception 'Order tidak dapat di-refund' using errcode = '23505';
  end if;

  select * into v_sale
  from public.pos_payments
  where order_id = p_order_id and kind = 'sale';

  if not found then
    raise exception 'Pembayaran awal tidak ditemukan' using errcode = 'P0002';
  end if;

  select * into v_shift
  from public.pos_shifts
  where status = 'open'
  limit 1
  for update;

  if not found then
    raise exception 'Buka shift sebelum memproses refund' using errcode = 'P0001';
  end if;

  insert into public.pos_payments (
    order_id, shift_id, kind, method, amount,
    tendered, change_amount, idempotency_key, processed_by
  ) values (
    v_order.id, v_shift.id, 'refund', v_sale.method, v_order.total,
    v_order.total, 0, p_idempotency_key, v_actor
  ) returning * into v_refund;

  if coalesce(p_restock, false) then
    for v_item in
      select i.product_id, i.quantity, p.track_stock
      from public.pos_order_items i
      join public.pos_products p on p.id = i.product_id
      where i.order_id = p_order_id
      for update of p
    loop
      if v_item.track_stock then
        update public.pos_products
        set stock = stock + v_item.quantity,
            sold_out = false,
            updated_at = now()
        where id = v_item.product_id;

        insert into public.pos_stock_movements (
          product_id, order_id, quantity_delta, reason, actor_id
        ) values (
          v_item.product_id, p_order_id, v_item.quantity, 'refund', v_actor
        );
      end if;
    end loop;
  end if;

  update public.pos_orders
  set payment_status = 'refunded', updated_at = now()
  where id = p_order_id;

  insert into public.pos_audit_logs (
    actor_id, action, entity_type, entity_id, reason, metadata
  ) values (
    v_actor, 'order_refunded', 'order', p_order_id::text, v_reason,
    jsonb_build_object('restocked', coalesce(p_restock, false))
  );

  return jsonb_build_object(
    'success', true,
    'payment_id', v_refund.id,
    'amount', v_order.total
  );
end
$$;

create or replace function public.pos_close_shift(
  p_shift_id uuid,
  p_actual_cash integer,
  p_notes text
)
returns public.pos_shifts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_shift public.pos_shifts;
  v_cash_sales integer;
  v_expected integer;
begin
  if not public.pos_has_role(array['owner', 'cashier']) then
    raise exception 'Cashier access required' using errcode = '42501';
  end if;
  if p_actual_cash is null or p_actual_cash < 0 then
    raise exception 'Invalid actual cash' using errcode = '22023';
  end if;
  if char_length(coalesce(p_notes, '')) > 500 then
    raise exception 'Catatan terlalu panjang' using errcode = '22023';
  end if;

  select * into v_shift
  from public.pos_shifts
  where id = p_shift_id and status = 'open'
  for update;

  if not found then
    raise exception 'Active shift not found' using errcode = 'P0002';
  end if;
  if v_shift.cashier_id <> v_actor
     and not public.pos_has_role(array['owner']) then
    raise exception 'Hanya kasir shift atau owner yang dapat menutup' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.pos_orders
    where shift_id = p_shift_id
      and status in ('pending', 'cooking', 'ready')
  ) then
    raise exception 'Selesaikan atau void semua order sebelum menutup shift' using errcode = '23505';
  end if;

  select coalesce(sum(
    case
      when kind = 'sale' and method = 'cash' then amount
      when kind = 'refund' and method = 'cash' then -amount
      else 0
    end
  ), 0)::integer
  into v_cash_sales
  from public.pos_payments
  where shift_id = p_shift_id;

  v_expected := v_shift.opening_cash + v_cash_sales;

  update public.pos_shifts
  set status = 'closed',
      expected_cash = v_expected,
      actual_cash = p_actual_cash,
      difference = p_actual_cash - v_expected,
      notes = nullif(btrim(coalesce(p_notes, '')), ''),
      closed_at = now()
  where id = p_shift_id
  returning * into v_shift;

  insert into public.pos_audit_logs (
    actor_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor, 'shift_closed', 'shift', p_shift_id::text,
    jsonb_build_object(
      'expected_cash', v_expected,
      'actual_cash', p_actual_cash,
      'difference', p_actual_cash - v_expected
    )
  );

  return v_shift;
end
$$;

create or replace function public.pos_upsert_product(
  p_id uuid,
  p_category_id uuid,
  p_name text,
  p_price integer,
  p_stock integer,
  p_track_stock boolean,
  p_sold_out boolean,
  p_active boolean,
  p_image_url text,
  p_options jsonb
)
returns public.pos_products
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_product public.pos_products;
  v_old_stock integer := 0;
  v_delta integer := 0;
  v_name text := btrim(coalesce(p_name, ''));
  v_image text := nullif(btrim(coalesce(p_image_url, '')), '');
begin
  if not public.pos_has_role(array['owner']) then
    raise exception 'Owner access required' using errcode = '42501';
  end if;
  if char_length(v_name) not between 1 and 120
     or p_price is null or p_price not between 0 and 20000000
     or p_stock is null or p_stock not between 0 and 1000000
     or not public.pos_valid_product_options(coalesce(p_options, '[]'::jsonb))
     or (
       v_image is not null
       and (char_length(v_image) > 2048 or v_image !~ '^https://')
     ) then
    raise exception 'Invalid product data' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.pos_products (
      category_id, name, price, stock, track_stock,
      sold_out, active, image_url, options
    ) values (
      p_category_id, v_name, p_price, p_stock, coalesce(p_track_stock, true),
      coalesce(p_sold_out, false), coalesce(p_active, true),
      v_image,
      coalesce(p_options, '[]'::jsonb)
    ) returning * into v_product;
    v_delta := p_stock;
  else
    select stock into v_old_stock
    from public.pos_products
    where id = p_id
    for update;

    if not found then
      raise exception 'Product not found' using errcode = 'P0002';
    end if;

    update public.pos_products
    set category_id = p_category_id,
        name = v_name,
        price = p_price,
        stock = p_stock,
        track_stock = coalesce(p_track_stock, true),
        sold_out = coalesce(p_sold_out, false),
        active = coalesce(p_active, true),
        image_url = v_image,
        options = coalesce(p_options, '[]'::jsonb),
        updated_at = now()
    where id = p_id
    returning * into v_product;
    v_delta := p_stock - v_old_stock;
  end if;

  if v_delta <> 0 then
    insert into public.pos_stock_movements (
      product_id, quantity_delta, reason, actor_id
    ) values (
      v_product.id, v_delta, 'adjustment', v_actor
    );
  end if;

  insert into public.pos_audit_logs (
    actor_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor, 'product_saved', 'product', v_product.id::text,
    jsonb_build_object('stock_delta', v_delta, 'price', p_price)
  );

  return v_product;
end
$$;

create or replace function public.pos_upsert_table(
  p_id uuid,
  p_code text,
  p_active boolean
)
returns public.pos_tables
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_table public.pos_tables;
  v_code text := upper(btrim(coalesce(p_code, '')));
begin
  if not public.pos_has_role(array['owner']) then
    raise exception 'Owner access required' using errcode = '42501';
  end if;
  if v_code !~ '^[A-Za-z0-9-]{1,10}$' then
    raise exception 'Invalid table code' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.pos_tables (code, active)
    values (v_code, coalesce(p_active, true))
    returning * into v_table;
  else
    update public.pos_tables
    set code = v_code, active = coalesce(p_active, true)
    where id = p_id
    returning * into v_table;

    if not found then
      raise exception 'Table not found' using errcode = 'P0002';
    end if;
  end if;

  insert into public.pos_audit_logs (
    actor_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor, 'table_saved', 'table', v_table.id::text,
    jsonb_build_object('code', v_table.code, 'active', v_table.active)
  );

  return v_table;
end
$$;

alter table public.pos_staff enable row level security;
alter table public.pos_categories enable row level security;
alter table public.pos_products enable row level security;
alter table public.pos_tables enable row level security;
alter table public.pos_shifts enable row level security;
alter table public.pos_orders enable row level security;
alter table public.pos_order_items enable row level security;
alter table public.pos_payments enable row level security;
alter table public.pos_stock_movements enable row level security;
alter table public.pos_audit_logs enable row level security;
alter table public.pos_settings enable row level security;

create policy "pos_staff_self_or_owner_read"
on public.pos_staff for select to authenticated
using (
  user_id = (select auth.uid())
  or (select public.pos_has_role(array['owner']))
);

create policy "pos_categories_public_active_read"
on public.pos_categories for select to anon, authenticated
using (
  active = true
  or (select public.pos_has_role(array['owner']))
);

create policy "pos_products_public_active_read"
on public.pos_products for select to anon, authenticated
using (
  (
    active = true
    and (
      category_id is null
      or exists (
        select 1
        from public.pos_categories category
        where category.id = pos_products.category_id
          and category.active = true
      )
    )
  )
  or (
    select public.pos_has_role(array['owner', 'cashier', 'kitchen'])
  )
);

create policy "pos_tables_public_active_read"
on public.pos_tables for select to anon, authenticated
using (
  active = true
  or (select public.pos_has_role(array['owner']))
);

create policy "pos_shifts_staff_read"
on public.pos_shifts for select to authenticated
using ((select public.pos_has_role(array['owner', 'cashier', 'kitchen'])));

create policy "pos_orders_staff_read"
on public.pos_orders for select to authenticated
using ((select public.pos_has_role(array['owner', 'cashier', 'kitchen'])));

create policy "pos_order_items_staff_read"
on public.pos_order_items for select to authenticated
using ((select public.pos_has_role(array['owner', 'cashier', 'kitchen'])));

create policy "pos_payments_finance_read"
on public.pos_payments for select to authenticated
using ((select public.pos_has_role(array['owner', 'cashier'])));

create policy "pos_stock_owner_read"
on public.pos_stock_movements for select to authenticated
using ((select public.pos_has_role(array['owner'])));

create policy "pos_audit_owner_read"
on public.pos_audit_logs for select to authenticated
using ((select public.pos_has_role(array['owner'])));

create policy "pos_settings_public_read"
on public.pos_settings for select to anon, authenticated
using (true);

revoke all on public.pos_staff, public.pos_categories, public.pos_products,
  public.pos_tables, public.pos_shifts, public.pos_orders,
  public.pos_order_items, public.pos_payments, public.pos_stock_movements,
  public.pos_audit_logs, public.pos_settings from anon, authenticated;

grant select on public.pos_categories, public.pos_products, public.pos_tables,
  public.pos_settings to anon, authenticated;
grant select on public.pos_staff, public.pos_shifts, public.pos_orders,
  public.pos_order_items, public.pos_payments, public.pos_stock_movements,
  public.pos_audit_logs to authenticated;

revoke all on function public.pos_valid_product_options(jsonb) from public;
revoke all on function public.pos_options_match(jsonb, jsonb) from public;
revoke all on function public.pos_current_role() from public;
revoke all on function public.pos_has_role(text[]) from public;
revoke all on function public.pos_bootstrap_status() from public;
revoke all on function public.pos_request_access(text) from public;
revoke all on function public.pos_claim_first_owner(text) from public;
revoke all on function public.pos_set_staff_access(uuid, text, boolean) from public;
revoke all on function public.pos_open_shift(integer) from public;
revoke all on function public.pos_create_order(text, text, jsonb, uuid) from public;
revoke all on function public.pos_get_order_status(uuid, uuid) from public;
revoke all on function public.pos_update_order_status(uuid, text) from public;
revoke all on function public.pos_pay_order(uuid, text, integer, uuid) from public;
revoke all on function public.pos_void_order(uuid, text) from public;
revoke all on function public.pos_refund_order(uuid, text, boolean, uuid) from public;
revoke all on function public.pos_close_shift(uuid, integer, text) from public;
revoke all on function public.pos_upsert_product(
  uuid, uuid, text, integer, integer, boolean, boolean, boolean, text, jsonb
) from public;
revoke all on function public.pos_upsert_table(uuid, text, boolean) from public;

grant execute on function public.pos_has_role(text[]) to anon, authenticated;
grant execute on function public.pos_bootstrap_status() to authenticated;
grant execute on function public.pos_request_access(text) to authenticated;
grant execute on function public.pos_claim_first_owner(text) to authenticated;
grant execute on function public.pos_set_staff_access(uuid, text, boolean) to authenticated;
grant execute on function public.pos_open_shift(integer) to authenticated;
grant execute on function public.pos_create_order(text, text, jsonb, uuid) to service_role;
grant execute on function public.pos_get_order_status(uuid, uuid) to service_role;
grant execute on function public.pos_update_order_status(uuid, text) to authenticated;
grant execute on function public.pos_pay_order(uuid, text, integer, uuid) to authenticated;
grant execute on function public.pos_void_order(uuid, text) to authenticated;
grant execute on function public.pos_refund_order(uuid, text, boolean, uuid) to authenticated;
grant execute on function public.pos_close_shift(uuid, integer, text) to authenticated;
grant execute on function public.pos_upsert_product(
  uuid, uuid, text, integer, integer, boolean, boolean, boolean, text, jsonb
) to authenticated;
grant execute on function public.pos_upsert_table(uuid, text, boolean) to authenticated;

insert into public.pos_categories (name, sort_order)
values
  ('Makanan', 10),
  ('Minuman', 20)
on conflict (name) do nothing;

insert into public.pos_products (
  category_id, name, price, stock, image_url, options
)
select
  c.id,
  seed.name,
  seed.price,
  100,
  seed.image_url,
  seed.options
from public.pos_categories c
join (
  values
    ('Makanan', 'Batagor', 5000, 'https://i.imgur.com/JiFateR.jpeg',
      '[{"name":"Tipe","values":["Kuah","Kering"]}]'::jsonb),
    ('Makanan', 'Mie Level', 8000, 'https://i.imgur.com/u6FXtL7.jpeg',
      '[{"name":"Level","values":["0","1/2","1","2","3"]}]'::jsonb),
    ('Makanan', 'Cilok', 5000, 'https://i.imgur.com/xvHP2rG.jpeg', '[]'::jsonb),
    ('Minuman', 'Es Potong Milo (full)', 4000, 'https://i.imgur.com/3ilf7yY.jpeg', '[]'::jsonb),
    ('Minuman', 'Es Potong Milo (half)', 2000, 'https://i.imgur.com/3ilf7yY.jpeg', '[]'::jsonb),
    ('Minuman', 'Es Potong Real good (full)', 2000, 'https://i.imgur.com/3ilf7yY.jpeg',
      '[{"name":"Rasa","values":["Coklat","Strawberry","Blueberry","Guava","Blackcurrant"]}]'::jsonb),
    ('Minuman', 'Es Potong Real good (1/2)', 1000, 'https://i.imgur.com/3ilf7yY.jpeg',
      '[{"name":"Rasa","values":["Coklat","Strawberry","Blueberry","Guava","Blackcurrant"]}]'::jsonb),
    ('Makanan', 'Suki Bakar', 5000, 'https://i.imgur.com/LPkTB2B.jpeg', '[]'::jsonb),
    ('Makanan', 'Sosis Bakar', 5000, 'https://i.imgur.com/ZxwgE0.jpeg', '[]'::jsonb),
    ('Makanan', 'Jasuke', 5000, 'https://i.imgur.com/OGNZogQ.jpeg', '[]'::jsonb)
) as seed(category_name, name, price, image_url, options)
  on seed.category_name = c.name
on conflict (name) do nothing;

insert into public.pos_tables (code)
select 'A' || n::text
from generate_series(1, 10) as n
on conflict (code) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pos_orders'
  ) then
    alter publication supabase_realtime
      add table public.pos_orders;
  end if;
end
$$;
