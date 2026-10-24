import { describe, expect, it } from 'vitest'
import { INITIAL_ITEMS, calculateDelivery, calculateSubtotal, calculateTotal } from './cartMath'

// These tests pin the planted bugs: if one fails, a refactoring has "fixed" a bug by accident.
describe('cart planted bugs', () => {
  it('CART-07: the initial subtotal shows a float rounding error', () => {
    const subtotal = calculateSubtotal(INITIAL_ITEMS)
    expect(String(subtotal)).toBe('51.400000000000006')
  })

  it('CART-08: exactly 50 is reachable and still charges delivery', () => {
    const items = [
      { id: 'filters', name: 'Filters', price: 2.1, quantity: 5 },
      { id: 'mug', name: 'Mug', price: 7.3, quantity: 2 },
      { id: 'press', name: 'Press', price: 24.9, quantity: 1 },
    ]
    const subtotal = calculateSubtotal(items)
    expect(Math.round(subtotal * 100)).toBe(5000)
    expect(calculateDelivery(subtotal)).toBe(4.9)
  })

  it('CART-09: total ignores delivery', () => {
    expect(calculateTotal(30, 0, 4.9)).toBe(30)
  })
})
