import { create } from 'zustand'
import api from '../services/api'
import useCartStore from './useCartStore'

// Permission map — which roles can access each section
const PERMISSIONS = {
  dashboard:       ['super_admin', 'admin', 'order_manager'],
  orders:          ['super_admin', 'admin', 'order_manager'],
  customers:       ['super_admin', 'admin', 'order_manager'],
  chat:            ['super_admin', 'admin', 'order_manager'],
  products:        ['super_admin', 'admin'],
  categories:      ['super_admin', 'admin'],
  coupons:         ['super_admin', 'admin'],
  reviews:         ['super_admin', 'admin'],
  banners:         ['super_admin', 'admin'],
  erp:             ['super_admin', 'admin'],
  fraud:           ['super_admin', 'admin'],
  settings:        ['super_admin'],
  role_management: ['super_admin'],
}

const useAuthStore = create((set, get) => ({
  user:    JSON.parse(localStorage.getItem('user') || 'null'),
  token:   localStorage.getItem('token') || null,
  loading: false,

  login: async (identifier, password) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/login', { identifier, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, loading: false })
      useCartStore.getState().mergeGuestCart()
      return data
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  register: async (payload) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/register', payload)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, loading: false })
      useCartStore.getState().mergeGuestCart()
      return data
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  logout: async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },

  updateUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },

  // Any staff role (can enter /admin)
  isAdmin: () => {
    const user = get().user
    return user && ['admin', 'super_admin', 'order_manager'].includes(user.role)
  },

  isSuperAdmin:   () => get().user?.role === 'super_admin',
  isOrderManager: () => get().user?.role === 'order_manager',
  isAuthenticated: () => !!get().token,

  // Check if the current user can access a named permission
  canAccess: (permission) => {
    const role = get().user?.role
    if (!role) return false
    return PERMISSIONS[permission]?.includes(role) ?? false
  },

  // Redirect target after login based on role
  loginRedirect: () => {
    const role = get().user?.role
    if (['admin', 'super_admin'].includes(role)) return '/admin'
    if (role === 'order_manager') return '/admin/orders'
    return '/'
  },
}))

export default useAuthStore
