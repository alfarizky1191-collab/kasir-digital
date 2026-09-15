import {
  readJson,
  supabaseFetch,
} from '@/lib/supabase-rest'
import type { PosOrder } from '@/lib/types'

const ORDER_SELECT = [
  'id',
  'order_number',
  'customer_name',
  'table_code',
  'shift_id',
  'status',
  'payment_status',
  'total',
  'created_at',
  'updated_at',
  'ready_at',
  'completed_at',
  'items:pos_order_items(id,product_id,product_name,options,quantity,unit_price,subtotal)',
].join(',')

export async function listOrders(
  token: string,
  filters: Record<string, string>,
) {
  const params = new URLSearchParams({
    select: ORDER_SELECT,
    ...filters,
  })
  const response = await supabaseFetch(
    `rest/v1/pos_orders?${params.toString()}`,
    {},
    token,
  )

  return readJson<PosOrder[]>(response)
}

export async function getOrder(
  token: string,
  id: string,
) {
  const orders = await listOrders(token, {
    id: `eq.${id}`,
    limit: '1',
  })

  return orders[0] || null
}
