import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const production = readFileSync(
  new URL(
    '../../supabase/migrations/202609150001_pos_production.sql',
    import.meta.url,
  ),
  'utf8',
)
const rateLimit = readFileSync(
  new URL(
    '../../supabase/migrations/202609150003_pos_rate_limit.sql',
    import.meta.url,
  ),
  'utf8',
)

test('every POS data table enables row-level security', () => {
  const tables = [
    'staff',
    'categories',
    'products',
    'tables',
    'shifts',
    'orders',
    'order_items',
    'payments',
    'stock_movements',
    'audit_logs',
    'settings',
  ]

  for (const table of tables) {
    assert.match(
      production,
      new RegExp(
        `alter table public\\.pos_${table} enable row level security;`,
      ),
    )
  }
  assert.match(
    rateLimit,
    /alter table public\.pos_rate_limits enable row level security;/,
  )
})

test('customer write RPCs are callable only by the server role', () => {
  assert.match(
    production,
    /grant execute on function public\.pos_create_order\(text, text, jsonb, uuid\) to service_role;/,
  )
  assert.match(
    production,
    /grant execute on function public\.pos_get_order_status\(uuid, uuid\) to service_role;/,
  )
  assert.match(
    rateLimit,
    /grant execute on function public\.pos_check_order_rate\(text, integer, integer\)[\s\S]*?to service_role;/,
  )
  assert.doesNotMatch(
    production,
    /grant execute on function public\.pos_create_order\([^;]+to (?:anon|authenticated)/,
  )
})

test('transaction and role invariants remain in the schema', () => {
  assert.match(production, /create unique index pos_one_sale_per_order_idx/)
  assert.match(production, /where id = p_order_id[\s\S]*?for update;/)
  assert.match(
    production,
    /Idempotency key digunakan untuk transaksi lain/,
  )
  assert.match(
    production,
    /Minimal satu owner aktif harus dipertahankan/,
  )
  assert.match(production, /Buka shift sebelum memproses refund/)
  assert.match(production, /public\.pos_options_match\(v_product\.options, v_options\)/)
})
