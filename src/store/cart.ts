import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  variantId: string
  name: string
  slug: string
  variant: string
  priceInKurus: number
  quantity: number
  unit: 'g' | 'kg' | 'piece'
  imageUrl: string
}

/** How long a harvest-quota reservation is held after the first item is added. */
export const RESERVATION_TTL_MS = 10 * 60 * 1000 // 10 minutes

interface CartState {
  items: CartItem[]
  /** Unix ms timestamp when the current reservation window opened. */
  reservedAt: number | null
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      reservedAt: null,

      addItem: (item) => {
        set((state) => {
          const now = Date.now()
          const reservationExpired =
            state.reservedAt === null ||
            now - state.reservedAt >= RESERVATION_TTL_MS

          const existing = state.items.find((i) => i.variantId === item.variantId)
          const newItems = existing
            ? state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              )
            : [...state.items, item]

          return {
            items: newItems,
            // Only open a new reservation window if none is currently active.
            reservedAt: reservationExpired ? now : state.reservedAt,
          }
        })
      },

      removeItem: (variantId) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.variantId !== variantId)
          return {
            items: newItems,
            reservedAt: newItems.length === 0 ? null : state.reservedAt,
          }
        })
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [], reservedAt: null }),
    }),
    {
      name: 'dalindankapiya-cart',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
    }
  )
)

// ── Pure helpers (safe outside React) ────────────────────────

export const cartItemCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.quantity, 0)

export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.priceInKurus * i.quantity, 0)

/** Seconds left in the current reservation window, or 0 if expired/absent. */
export const getReservationSecondsLeft = (reservedAt: number | null): number => {
  if (reservedAt === null) return 0
  return Math.max(0, Math.floor((RESERVATION_TTL_MS - (Date.now() - reservedAt)) / 1000))
}

export const isReservationActive = (reservedAt: number | null): boolean =>
  getReservationSecondsLeft(reservedAt) > 0
