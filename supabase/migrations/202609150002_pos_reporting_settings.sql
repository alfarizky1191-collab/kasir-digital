-- Reporting and configurable POS settings.

create or replace function public.pos_dashboard_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with payment_totals as (
    select
      coalesce(sum(
        case when kind = 'sale' then amount else -amount end
      ), 0)::integer as net_revenue,
      count(*) filter (where kind = 'sale')::integer as transaction_count
    from public.pos_payments
  ),
  today_totals as (
    select
      coalesce(sum(
        case when kind = 'sale' then amount else -amount end
      ), 0)::integer as net_revenue
    from public.pos_payments
    where (created_at at time zone 'Asia/Jakarta')::date =
          (now() at time zone 'Asia/Jakarta')::date
  ),
  item_totals as (
    select coalesce(sum(i.quantity), 0)::integer as items_sold
    from public.pos_order_items i
    join public.pos_orders o on o.id = i.order_id
    where o.payment_status = 'paid'
  ),
  low_stock as (
    select count(*)::integer as product_count
    from public.pos_products
    where active = true
      and track_stock = true
      and stock <= 5
  ),
  top_products as (
    select coalesce(jsonb_agg(
      jsonb_build_object('name', ranked.product_name, 'quantity', ranked.quantity)
      order by ranked.quantity desc
    ), '[]'::jsonb) as data
    from (
      select i.product_name, sum(i.quantity)::integer as quantity
      from public.pos_order_items i
      join public.pos_orders o on o.id = i.order_id
      where o.payment_status = 'paid'
      group by i.product_name
      order by quantity desc
      limit 5
    ) ranked
  )
  select jsonb_build_object(
    'net_revenue', payment_totals.net_revenue,
    'today_revenue', today_totals.net_revenue,
    'transaction_count', payment_totals.transaction_count,
    'items_sold', item_totals.items_sold,
    'low_stock_count', low_stock.product_count,
    'top_products', top_products.data
  )
  from payment_totals, today_totals, item_totals, low_stock, top_products
  where public.pos_has_role(array['owner'])
$$;

create or replace function public.pos_update_settings(
  p_business_name text,
  p_qris_image_url text
)
returns public.pos_settings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_settings public.pos_settings;
  v_name text := btrim(coalesce(p_business_name, ''));
  v_qris_url text := nullif(btrim(coalesce(p_qris_image_url, '')), '');
begin
  if not public.pos_has_role(array['owner']) then
    raise exception 'Owner access required' using errcode = '42501';
  end if;
  if char_length(v_name) not between 2 and 100 then
    raise exception 'Nama usaha harus 2-100 karakter' using errcode = '22023';
  end if;
  if v_qris_url is not null
     and (char_length(v_qris_url) > 2048 or v_qris_url !~ '^https://') then
    raise exception 'URL QRIS harus menggunakan HTTPS' using errcode = '22023';
  end if;

  update public.pos_settings
  set business_name = v_name,
      qris_image_url = v_qris_url,
      updated_at = now(),
      updated_by = v_actor
  where id = true
  returning * into v_settings;

  insert into public.pos_audit_logs (
    actor_id, action, entity_type, entity_id
  ) values (
    v_actor, 'settings_updated', 'settings', 'global'
  );

  return v_settings;
end
$$;

create or replace function public.pos_upsert_category(
  p_id uuid,
  p_name text,
  p_sort_order integer,
  p_active boolean
)
returns public.pos_categories
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_category public.pos_categories;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if not public.pos_has_role(array['owner']) then
    raise exception 'Owner access required' using errcode = '42501';
  end if;
  if char_length(v_name) not between 1 and 80 then
    raise exception 'Invalid category name' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.pos_categories (name, sort_order, active)
    values (v_name, coalesce(p_sort_order, 0), coalesce(p_active, true))
    returning * into v_category;
  else
    update public.pos_categories
    set name = v_name,
        sort_order = coalesce(p_sort_order, 0),
        active = coalesce(p_active, true)
    where id = p_id
    returning * into v_category;

    if not found then
      raise exception 'Category not found' using errcode = 'P0002';
    end if;
  end if;

  insert into public.pos_audit_logs (
    actor_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor, 'category_saved', 'category', v_category.id::text,
    jsonb_build_object('name', v_category.name)
  );

  return v_category;
end
$$;

revoke all on function public.pos_dashboard_summary() from public;
revoke all on function public.pos_update_settings(text, text) from public;
revoke all on function public.pos_upsert_category(uuid, text, integer, boolean) from public;

grant execute on function public.pos_dashboard_summary() to authenticated;
grant execute on function public.pos_update_settings(text, text) to authenticated;
grant execute on function public.pos_upsert_category(uuid, text, integer, boolean) to authenticated;
