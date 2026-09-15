-- Anonymous order rate limiting. Only keyed hashes are stored; raw IP addresses are never persisted.

create table public.pos_rate_limits (
  key_hash text primary key check (char_length(key_hash) = 64),
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1 check (request_count > 0)
);

create index pos_rate_limits_window_idx
  on public.pos_rate_limits (window_started_at);

alter table public.pos_rate_limits enable row level security;
revoke all on public.pos_rate_limits from anon, authenticated;

create or replace function public.pos_check_order_rate(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_key_hash !~ '^[a-f0-9]{64}$'
     or p_limit not between 1 and 100
     or p_window_seconds not between 10 and 3600 then
    raise exception 'Invalid rate limit request' using errcode = '22023';
  end if;

  insert into public.pos_rate_limits (
    key_hash, window_started_at, request_count
  ) values (
    p_key_hash, now(), 1
  )
  on conflict (key_hash) do update
  set window_started_at = case
        when public.pos_rate_limits.window_started_at
             <= now() - make_interval(secs => p_window_seconds)
          then now()
        else public.pos_rate_limits.window_started_at
      end,
      request_count = case
        when public.pos_rate_limits.window_started_at
             <= now() - make_interval(secs => p_window_seconds)
          then 1
        else public.pos_rate_limits.request_count + 1
      end
  returning request_count into v_count;

  delete from public.pos_rate_limits
  where window_started_at < now() - interval '1 day';

  return v_count <= p_limit;
end
$$;

revoke all on function public.pos_check_order_rate(text, integer, integer) from public;
grant execute on function public.pos_check_order_rate(text, integer, integer)
  to service_role;
