import { ref } from 'vue'
import { supabase } from '../lib/supabase.client'

const RUTA_LOGIN = '/auth/login'
const RUTA_ADMIN = '/admin'

export function useAuth() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const message = ref<string | null>(null)

  async function signUp(email: string, password: string, fullName: string) {
    loading.value = true
    error.value = null
    message.value = null

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }, // llega a raw_user_meta_data
        emailRedirectTo: `${window.location.origin}${RUTA_LOGIN}`,
      },
    })

    loading.value = false

    if (err) {
      error.value = err.message
      return false
    }

    // Si la confirmación por correo está activa, no hay sesión todavía
    if (!data.session) {
      message.value = 'Revisa tu correo para confirmar tu cuenta.'
    } else {
      window.location.href = RUTA_ADMIN
    }
    return true
  }

  async function signIn(email: string, password: string) {
    loading.value = true
    error.value = null

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    loading.value = false

    if (err) {
      error.value = err.message
      return false
    }

    window.location.href = RUTA_ADMIN
    return true
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = RUTA_LOGIN
  }

  // Guardia de ruta para páginas estáticas: el HTML prerenderizado no sabe si
  // hay sesión, así que se comprueba en el navegador. Devuelve la sesión o
  // redirige al login (replace: no deja /admin en el historial).
  async function requireSession() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      window.location.replace(RUTA_LOGIN)
      return null
    }
    return data.session
  }

  return { loading, error, message, signUp, signIn, signOut, requireSession }
}
