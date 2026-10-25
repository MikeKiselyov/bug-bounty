import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  INITIAL_ITEMS,
  PROMO_CODE,
  PROMO_PERCENT,
  STAFF_PROMO_CODE,
  STAFF_PROMO_PERCENT,
  FREE_DELIVERY_FROM,
  calculateDelivery,
  calculateSubtotal,
  calculateTotal,
  countUnits,
  formatMoney,
} from './cartMath'
import type { CartItem } from './cartMath'
import { useBugTrigger } from '../../lib/bugTrigger'
import { useMediaQuery } from '../../lib/mediaQuery'
import './cart.css'

// Planted bugs are marked with "BUG CART-xx". Keep them when refactoring:
// the catalog in bugs.json depends on them. trigger('CART-xx') fires when a bug becomes observable.

interface PlacedOrder {
  number: number
  total: number
  units: number
}

function MinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function CartApp() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS)
  const [badgeCount, setBadgeCount] = useState(countUnits(INITIAL_ITEMS))
  const [promoInput, setPromoInput] = useState('')
  const [promoMessage, setPromoMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null)

  const subtotal = calculateSubtotal(items)
  const discount = (subtotal * discountPercent) / 100
  const delivery = calculateDelivery(subtotal)
  const total = calculateTotal(subtotal, discount, delivery)
  const trigger = useBugTrigger()
  // Same query as in cart.css.
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)')

  useEffect(() => {
    if (isTablet && !placedOrder) {
      // BUG CART-13: on tablets the checkout button text has the color of the button, see .cart-primary.
      trigger('CART-13')
    }
  }, [isTablet, placedOrder, trigger])

  const subtotalInCents = Math.round(subtotal * 100)
  const isDeliveryCharged = delivery > 0
  useEffect(() => {
    if (isDeliveryCharged && subtotalInCents === FREE_DELIVERY_FROM * 100) {
      trigger('CART-08')
    }
    if (isDeliveryCharged) {
      trigger('CART-09')
    }
  }, [isDeliveryCharged, subtotalInCents, trigger])

  function changeQuantity(itemId: string, change: number) {
    const nextItems: CartItem[] = []
    for (const item of items) {
      if (item.id === itemId) {
        // BUG CART-01: no lower bound for the quantity.
        const nextQuantity = item.quantity + change
        if (nextQuantity < 1) {
          trigger('CART-01')
        }
        nextItems.push({ ...item, quantity: nextQuantity })
      } else {
        nextItems.push(item)
      }
    }
    setItems(nextItems)
    setBadgeCount(countUnits(nextItems))
  }

  function removeItem(itemId: string) {
    // BUG CART-04: the clicked id is ignored, the first item is always removed.
    if (items.length === 0) {
      return
    }
    const removedItem = items[0]
    if (removedItem.id !== itemId) {
      trigger('CART-04')
    }
    if (removedItem.quantity !== 0) {
      trigger('CART-11')
    }
    setItems(items.slice(1))
    // BUG CART-11: badgeCount is not updated here.
  }

  function applyPromo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = promoInput.trim()
    if (code === '') {
      setPromoMessage({ ok: false, text: 'Enter a promo code' })
      return
    }
    // BUG CART-12: every check logs the list of valid codes, the staff-only one included.
    console.log('[promo] checking "' + code + '" against', [PROMO_CODE, STAFF_PROMO_CODE])
    if (code === STAFF_PROMO_CODE) {
      trigger('CART-12')
      setDiscountPercent(discountPercent + STAFF_PROMO_PERCENT)
      setPromoMessage({ ok: true, text: 'Promo code ' + STAFF_PROMO_CODE + ' applied' })
      return
    }
    // BUG CART-05: case-sensitive comparison.
    if (code !== PROMO_CODE && code.toUpperCase() === PROMO_CODE) {
      trigger('CART-05')
    }
    if (code === PROMO_CODE) {
      // BUG CART-06: the discount stacks on every apply.
      if (discountPercent > 0) {
        trigger('CART-06')
      }
      setDiscountPercent(discountPercent + PROMO_PERCENT)
      setPromoMessage({ ok: true, text: 'Promo code ' + PROMO_CODE + ' applied' })
    } else {
      setPromoMessage({ ok: false, text: 'Promo code not found' })
    }
  }

  function checkout() {
    // BUG CART-10: an empty cart is not blocked.
    if (countUnits(items) <= 0) {
      trigger('CART-10')
    }
    const orderNumber = 1042 + orderCount + 1
    setOrderCount(orderCount + 1)
    setPlacedOrder({ number: orderNumber, total, units: countUnits(items) })
  }

  function backToShop() {
    setItems(INITIAL_ITEMS)
    setBadgeCount(countUnits(INITIAL_ITEMS))
    setDiscountPercent(0)
    setPromoInput('')
    setPromoMessage(null)
    setPlacedOrder(null)
  }

  return (
    <div className="cart-page" data-bh="other">
      <header className="cart-header">
        <span className="cart-logo">Bean &amp; Steam</span>
        <span className="cart-badge" data-bh="badge">
          Cart <span className="cart-badge-count">{badgeCount}</span>
        </span>
      </header>

      {placedOrder ? (
        <section className="cart-done" role="status" data-bh="checkout">
          <h2>Order #{placedOrder.number} placed</h2>
          <p>
            Items: {placedOrder.units}. To pay: {formatMoney(placedOrder.total)}
          </p>
          <button type="button" className="cart-primary" onClick={backToShop}>
            Back to the shop
          </button>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Items in the cart">
            <h2 className="cart-title">Your cart</h2>
            {items.length === 0 ? <p className="cart-empty">Your cart is empty</p> : null}
            {items.map((item) => (
              <div className="cart-row" key={item.id}>
                {/* BUG CART-03: long names overflow, see .cart-name in cart.css. */}
                <div className="cart-name" data-bh="product">
                  {item.name}
                </div>
                <div className="cart-price">{formatMoney(item.price)}</div>
                <div className="cart-qty" data-bh="quantity">
                  {/* BUG CART-02: icon-only buttons without aria-label. */}
                  <button type="button" onClick={() => changeQuantity(item.id, -1)}>
                    <MinusIcon />
                  </button>
                  <span className="cart-qty-value">{item.quantity}</span>
                  <button type="button" onClick={() => changeQuantity(item.id, 1)}>
                    <PlusIcon />
                  </button>
                </div>
                <div className="cart-line-total">{formatMoney(item.price * item.quantity)}</div>
                <button type="button" className="cart-remove" data-bh="remove" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </div>
            ))}
          </section>

          <aside className="cart-summary" aria-label="Order summary">
            <p className="cart-promo-banner" data-bh="promo">
              Use code <strong>{PROMO_CODE}</strong> for {PROMO_PERCENT}% off your order
            </p>
            <form className="cart-promo" onSubmit={applyPromo} data-bh="promo">
              <label htmlFor="cart-promo-input">Promo code</label>
              <div className="cart-promo-row">
                <input
                  id="cart-promo-input"
                  type="text"
                  value={promoInput}
                  onChange={(event) => setPromoInput(event.target.value)}
                />
                <button type="submit">Apply</button>
              </div>
              {promoMessage ? (
                <span className={promoMessage.ok ? 'cart-promo-ok' : 'cart-promo-error'} role="status">
                  {promoMessage.text}
                </span>
              ) : null}
            </form>

            <dl className="cart-lines">
              <div data-bh="subtotal">
                <dt>Items</dt>
                <dd>{subtotal} €</dd>
              </div>
              {discountPercent > 0 ? (
                <div data-bh="promo">
                  <dt>Discount {discountPercent}%</dt>
                  <dd>-{formatMoney(discount)}</dd>
                </div>
              ) : null}
              <div data-bh="delivery">
                <dt>Delivery</dt>
                <dd>{delivery === 0 ? 'Free' : formatMoney(delivery)}</dd>
              </div>
              <div className="cart-total" data-bh="total">
                <dt>Total</dt>
                <dd>{formatMoney(total)}</dd>
              </div>
            </dl>
            <p className="cart-note" data-bh="delivery">Free delivery from {FREE_DELIVERY_FROM} €</p>
            <button type="button" className="cart-primary" onClick={checkout} data-bh="checkout">
              Checkout
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}
