export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export const INITIAL_ITEMS: CartItem[] = [
  {
    id: 'filters',
    name: 'V60 pour-over paper filters, size 02, pack of 100, unbleached and odourless',
    price: 2.1,
    quantity: 3,
  },
  { id: 'coffee', name: 'Ethiopia whole bean coffee, 1 kg', price: 12.9, quantity: 1 },
  { id: 'mug', name: 'Ceramic mug, 350 ml', price: 7.3, quantity: 1 },
  { id: 'press', name: 'French press, 1 l', price: 24.9, quantity: 1 },
]

export const PROMO_CODE = 'SALE10'
export const PROMO_PERCENT = 10
// Staff-only code, never shown to customers.
export const STAFF_PROMO_CODE = 'BARISTA50'
export const STAFF_PROMO_PERCENT = 50
export const DELIVERY_PRICE = 4.9
export const FREE_DELIVERY_FROM = 50

// BUG CART-07: money is summed as floats and the raw value is shown.
export function calculateSubtotal(items: CartItem[]): number {
  let subtotal = 0
  for (const item of items) {
    subtotal = subtotal + item.price * item.quantity
  }
  return subtotal
}

export function countUnits(items: CartItem[]): number {
  let units = 0
  for (const item of items) {
    units = units + item.quantity
  }
  return units
}

export function calculateDelivery(subtotal: number): number {
  const roundedSubtotal = Math.round(subtotal * 100) / 100
  // BUG CART-08: should be ">=", the promise is "free from 50".
  if (roundedSubtotal > FREE_DELIVERY_FROM) {
    return 0
  }
  return DELIVERY_PRICE
}

export function calculateTotal(subtotal: number, discount: number, delivery: number): number {
  // BUG CART-09: delivery is ignored.
  void delivery
  return subtotal - discount
}

export function formatMoney(value: number): string {
  return value.toFixed(2) + ' €'
}
