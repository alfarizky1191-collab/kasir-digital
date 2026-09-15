export type StaffRole = 'owner' | 'cashier' | 'kitchen'

export type StaffProfile = {
  user_id: string
  display_name: string
  role: StaffRole | null
  active: boolean
  requested_at: string
}

export type ProductOption = {
  name: string
  values: string[]
}

export type Product = {
  id: string
  category_id: string | null
  name: string
  price: number
  stock: number
  track_stock: boolean
  sold_out: boolean
  active: boolean
  image_url: string | null
  options: ProductOption[]
}

export type DiningTable = {
  id: string
  code: string
  active: boolean
}

export type OrderItem = {
  id: number
  product_id: string | null
  product_name: string
  options: Record<string, string>
  quantity: number
  unit_price: number
  subtotal: number
}

export type PosPayment = {
  id: string
  kind: 'sale' | 'refund'
  method: 'cash' | 'qris'
  amount: number
  tendered: number | null
  change_amount: number
  created_at: string
}

export type PosOrder = {
  id: string
  order_number: number
  customer_name: string
  table_code: string | null
  shift_id: string
  status: 'pending' | 'cooking' | 'ready' | 'completed' | 'cancelled'
  payment_status: 'unpaid' | 'paid' | 'refunded' | 'voided'
  total: number
  created_at: string
  updated_at: string
  ready_at: string | null
  completed_at: string | null
  items?: OrderItem[]
  payments?: PosPayment[]
}

export type Shift = {
  id: string
  cashier_id: string
  cashier_name: string
  opening_cash: number
  expected_cash: number | null
  actual_cash: number | null
  difference: number | null
  status: 'open' | 'closed'
  notes: string | null
  opened_at: string
  closed_at: string | null
}

export type ApiError = {
  error: string
}
