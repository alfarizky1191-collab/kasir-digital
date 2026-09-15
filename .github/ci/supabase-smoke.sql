do $$
declare
  v_owner uuid := '11111111-1111-4111-8111-111111111111';
  v_product uuid;
  v_stock_before integer;
  v_order jsonb;
  v_duplicate jsonb;
  v_order_id uuid;
  v_payment jsonb;
  v_shift public.pos_shifts;
begin
  insert into auth.users (id) values (v_owner);
  perform set_config(
    'request.jwt.claim.sub',
    v_owner::text,
    true
  );

  perform public.pos_claim_first_owner('Owner Test');

  begin
    perform public.pos_set_staff_access(
      v_owner,
      'cashier',
      true
    );
    raise exception 'Owner self-demotion guard did not run';
  exception
    when sqlstate '22023' then null;
  end;

  v_shift := public.pos_open_shift(100000);

  select id, stock
  into v_product, v_stock_before
  from public.pos_products
  where name = 'Cilok';

  v_order := public.pos_create_order(
    'Smoke Test',
    'A1',
    jsonb_build_array(
      jsonb_build_object(
        'product_id', v_product,
        'quantity', 2,
        'options', '{}'::jsonb
      )
    ),
    '22222222-2222-4222-8222-222222222222'
  );
  v_duplicate := public.pos_create_order(
    'Ignored Retry Payload',
    'A1',
    jsonb_build_array(
      jsonb_build_object(
        'product_id', v_product,
        'quantity', 2,
        'options', '{}'::jsonb
      )
    ),
    '22222222-2222-4222-8222-222222222222'
  );

  if v_order->>'id' is distinct from v_duplicate->>'id' then
    raise exception 'Order idempotency failed';
  end if;

  v_order_id := (v_order->>'id')::uuid;

  if (
    select stock
    from public.pos_products
    where id = v_product
  ) <> v_stock_before - 2 then
    raise exception 'Atomic stock deduction failed';
  end if;

  begin
    perform public.pos_create_order(
      'Invalid Options',
      'A1',
      jsonb_build_array(
        jsonb_build_object(
          'product_id', v_product,
          'quantity', 1,
          'options', '{"unexpected":"value"}'::jsonb
        )
      ),
      '33333333-3333-4333-8333-333333333333'
    );
    raise exception 'Invalid product options were accepted';
  exception
    when sqlstate '22023' then null;
  end;

  perform public.pos_update_order_status(v_order_id, 'cooking');
  perform public.pos_update_order_status(v_order_id, 'ready');

  v_payment := public.pos_pay_order(
    v_order_id,
    'cash',
    15000,
    '44444444-4444-4444-8444-444444444444'
  );
  perform public.pos_pay_order(
    v_order_id,
    'cash',
    15000,
    '44444444-4444-4444-8444-444444444444'
  );

  if (v_payment->>'change_amount')::integer <> 5000 then
    raise exception 'Cash change calculation failed';
  end if;

  perform public.pos_refund_order(
    v_order_id,
    'Smoke test refund',
    true,
    '55555555-5555-4555-8555-555555555555'
  );

  if (
    select stock
    from public.pos_products
    where id = v_product
  ) <> v_stock_before then
    raise exception 'Refund stock restoration failed';
  end if;

  v_shift := public.pos_close_shift(
    v_shift.id,
    100000,
    'Smoke test complete'
  );

  if v_shift.status <> 'closed'
     or v_shift.difference <> 0 then
    raise exception 'Shift reconciliation failed';
  end if;

  if has_function_privilege(
    'anon',
    'public.pos_create_order(text,text,jsonb,uuid)',
    'execute'
  ) then
    raise exception 'Anonymous role can execute order creation';
  end if;

  if (
    select count(*)
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n
      on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname like 'pos_%'
      and c.relkind = 'r'
      and c.relrowsecurity = false
  ) <> 0 then
    raise exception 'A POS table is missing row-level security';
  end if;
end
$$;
