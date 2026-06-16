import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Profile
  const [profile, setProfile] = useState(null)

  // Role
  const [role, setRole] = useState('user')
  const [roleLoading, setRoleLoading] = useState(false)

  // -----------------------------
  // Fetch Profile
  // -----------------------------
  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }

    const { data } = await supabase
      .from('accessibility_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    setProfile(data)
  }

  // -----------------------------
  // Fetch Role
  // -----------------------------
  const fetchRole = async (userId) => {
    if (!userId) {
      setRole('user')
      return
    }

    setRoleLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Role fetch error:', error.message)
        setRole('user')
        return
      }

      setRole(data?.role === 'moderator' ? 'moderator' : 'user')
    } catch (e) {
      console.error('Role fetch failed:', e)
      setRole('user')
    } finally {
      setRoleLoading(false)
    }
  }

  // -----------------------------
  // Init Session + Auth Listener
  // -----------------------------
  useEffect(() => {
    let active = true

    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!active) return

        if (error) {
          console.error('Session init error:', error.message)
          setUser(null)
          setRole('user')
          return
        }

        const sessionUser = data?.session?.user ?? null
        setUser(sessionUser)

        if (sessionUser) {
          await Promise.all([
            fetchProfile(sessionUser.id),
            fetchRole(sessionUser.id)
          ])
        } else {
          setProfile(null)
          setRole('user')
        }
      } catch (e) {
        if (!active) return
        console.error('Session init failed:', e)
        setUser(null)
        setProfile(null)
        setRole('user')
      } finally {
        if (active) setLoading(false)
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return

        const sessionUser = session?.user ?? null
        setUser(sessionUser)
        setLoading(false)

        if (sessionUser) {
          Promise.resolve().then(() => {
            if (!active) return
            fetchProfile(sessionUser.id)
            fetchRole(sessionUser.id)
          })
        } else {
          setProfile(null)
          setRole('user')
          setRoleLoading(false)
        }
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // -----------------------------
  // Auth Actions
  // -----------------------------
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
    } catch (e) {
      console.error('Sign out failed:', e)
    } finally {
      setUser(null)
      setProfile(null)
      setRole('user')
      setRoleLoading(false)
      setLoading(false)
    }
  }

  // -----------------------------
  // Update Profile
  // -----------------------------
  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user logged in' }

    const { error } = await supabase
      .from('accessibility_preferences')
      .upsert(
        { user_id: user.id, ...updates },
        { onConflict: 'user_id' }
      )

    if (!error) {
      setProfile(prev => ({ ...prev, ...updates }))
    }

    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        roleLoading,
        isModerator: role === 'moderator',
        profile,
        signIn,
        signUp,
        signOut,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export default AuthContext;
