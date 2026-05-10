import { create } from 'zustand'
import api from '../services/api'

const useWishlistStore = create((set, get) => ({
  items: [],

  fetchWishlist: async () => {
    try {
      const { data } = await api.get('/wishlist')
      set({ items: data })
    } catch {}
  },

  toggle: async (productId) => {
    const { data } = await api.post('/wishlist/toggle', { product_id: productId })
    await get().fetchWishlist()
    return data
  },

  isWishlisted: (productId) => {
    return get().items.some(item => item.product_id === productId)
  },

  reset: () => set({ items: [] }),
}))

export default useWishlistStore
