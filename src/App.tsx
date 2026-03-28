import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Auth from './Auth.tsx'
import Zinyoku from './Zinyoku'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      setShowAuth(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ background: '#050510', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00f0ff', fontFamily: 'monospace' }}>
      LOADING...
    </div>
  )

  if (showAuth) return <Auth onLogin={() => setShowAuth(false)} onBack={() => setShowAuth(false)} />

  return <Zinyoku userId={session?.user?.id || null} onLoginRequest={() => setShowAuth(true)} />
}