import type { Bug, CaseDefinition } from '../../lib/types'
import bugs from './bugs.json'
import { CartApp } from './CartApp'

export const cartCase: CaseDefinition = {
  id: 'cart',
  code: 'CASE-02',
  title: 'Cart and checkout',
  description: 'Quantities, a promo code, delivery and the total. Money loves precision.',
  briefing:
    'Bean & Steam coffee shop. Requirements: quantity is at least 1, promo code SALE10 gives 10% once, delivery costs 4.90 € and is free from 50 €. Total = items - discount + delivery. Check that the cart counts money honestly.',
  level: 'middle',
  tags: ['e-commerce', 'money', 'state'],
  url: 'bean-and-steam.local/cart',
  elements: [
    { id: 'product', label: 'Product row / name' },
    { id: 'quantity', label: 'Quantity (+/-)' },
    { id: 'remove', label: '"Remove" button' },
    { id: 'promo', label: 'Promo code' },
    { id: 'subtotal', label: 'Items subtotal' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'total', label: 'Total to pay' },
    { id: 'checkout', label: '"Checkout" button' },
    { id: 'badge', label: 'Cart counter in the header' },
    { id: 'other', label: 'Other / whole page' },
  ],
  bugs: bugs as Bug[],
  App: CartApp,
}
