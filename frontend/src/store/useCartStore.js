import { create } from 'zustand'
import api from '../services/api'

const GUEST_KEY = 'guestCart'

const loadGuest = () => { try { return JSON.parse(localStorage.getItem(GUEST_KEY) || '[]') } catch { return [] } }
const saveGuest = (items) => localStorage.setItem(GUEST_KEY, JSON.stringify(items))
const clearGuest = () => localStorage.removeItem(GUEST_KEY)

const guestTotals = (items) => ({
  count: items.reduce((s, i) => s + i.quantity, 0),
  subtotal: items.reduce((s, i) => {
    const price = i.variant?.price ?? i.product?.sale_price ?? i.product?.price ?? 0
    return s + price * i.quantity
  }, 0),
})

const isLoggedIn = () => !!localStorage.getItem('token')

const useCartStore = create((set, get) => ({
  items: [],
  subtotal: 0,
  count: 0,
  loading: false,

  fetchCart: async () => {
    if (!isLoggedIn()) {
      const items = loadGuest()
      set({ items, ...guestTotals(items) })
      return
    }
    try {
      const { data } = await api.get('/cart')
      set({ items: data.items, subtotal: data.subtotal, count: data.count })
    } catch {}
  },

  addToCart: async (productId, variantId = null, quantity = 1, productData = null) => {
    if (!isLoggedIn()) {
      const items = loadGuest()
      const idx = items.findIndex(i => i.productId === productId && i.variantId === variantId)
      if (idx >= 0) {
        items[idx].quantity += quantity
      } else {
        items.push({
          id: `guest_${Date.now()}`,
          productId,
          variantId,
          quantity,
          product: productData,
          variant: null,
        })
      }
      saveGuest(items)
      set({ items, ...guestTotals(items) })
      return
    }
    const { data } = await api.post('/cart/add', { product_id: productId, variant_id: variantId, quantity })
    await get().fetchCart()
    return data
  },

  updateItem: async (itemId, quantity) => {
    if (!isLoggedIn()) {
      const items = loadGuest().map(i => i.id === itemId ? { ...i, quantity } : i)
      saveGuest(items)
      set({ items, ...guestTotals(items) })
      return
    }
    await api.put(`/cart/items/${itemId}`, { quantity })
    await get().fetchCart()
  },

  removeItem: async (itemId) => {
    if (!isLoggedIn()) {
      const items = loadGuest().filter(i => i.id !== itemId)
      saveGuest(items)
      set({ items, ...guestTotals(items) })
      return
    }
    await api.delete(`/cart/items/${itemId}`)
    await get().fetchCart()
  },

  clearCart: async () => {
    if (!isLoggedIn()) {
      clearGuest()
      set({ items: [], subtotal: 0, count: 0 })
      return
    }
    await api.delete('/cart/clear')
    set({ items: [], subtotal: 0, count: 0 })
  },

  mergeGuestCart: async () => {
    const guestItems = loadGuest()
    if (!guestItems.length) return
    for (const item of guestItems) {
      try {
        await api.post('/cart/add', { product_id: item.productId, variant_id: item.variantId, quantity: item.quantity })
      } catch {}
    }
    clearGuest()
    await get().fetchCart()
  },

  reset: () => set({ items: [], subtotal: 0, count: 0 }),
}))

export default useCartStore
