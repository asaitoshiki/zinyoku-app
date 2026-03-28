import { useState } from 'react'
import { supabase } from './supabase'

type Props = { onLogin: () => void; onBack?: () => void }

export default function Auth({ onLogin, onBack }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const s = {
    bg: '#050510', card: '#0d0d28', text: '#e0f0ff',
    sub: '#5080a0', accent: '#00f0ff', border: '#00f0ff44'
  }

  const handleSubmit = async () => {
    setLoading(true)
    setMessage('')
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('確認メールを送りました。メールを確認してください。')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else onLogin()
    }
    setLoading(false)
  }

  return (
    <div style={{ background: s.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier New', monospace", padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: s.sub,
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 11,
            marginBottom: 16, letterSpacing: 2
          }}>← BACK</button>
        )}

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: s.accent, letterSpacing: 4, marginBottom: 8 }}>ABSTINENCE.SYS</div>
          <div style={{ fontSize: 11, color: s.sub }}>v1.0 // AUTH MODULE</div>
        </div>

        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 10, color: s.accent, letterSpacing: 3, marginBottom: 20 }}>
            {isSignUp ? '// NEW USER REGISTRATION' : '// USER LOGIN'}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: s.sub, letterSpacing: 2, marginBottom: 6 }}>EMAIL</div>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ width: '100%', padding: '10px 12px', background: '#0a0a1f', border: `1px solid ${s.border}`, borderRadius: 8, color: s.text, fontFamily: 'inherit', fontSize: 13 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: s.sub, letterSpacing: 2, marginBottom: 6 }}>PASSWORD</div>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '10px 12px', background: '#0a0a1f', border: `1px solid ${s.border}`, borderRadius: 8, color: s.text, fontFamily: 'inherit', fontSize: 13 }}
            />
          </div>

          {message && (
            <div style={{ fontSize: 12, color: message.includes('メール') ? s.accent : '#ff6688', marginBottom: 16, padding: '8px 12px', background: '#0a0a1f', borderRadius: 8 }}>
              {message}
            </div>
          )}

          <button
            onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', padding: 12, background: 'transparent', border: `1px solid ${s.accent}`, borderRadius: 8, color: s.accent, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, letterSpacing: 2, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)` }} />
            {loading ? '[ PROCESSING... ]' : isSignUp ? '[ CREATE ACCOUNT ]' : '[ LOGIN ]'}
          </button>

          <button
            onClick={() => { setIsSignUp(v => !v); setMessage('') }}
            style={{ width: '100%', marginTop: 12, padding: 10, background: 'none', border: 'none', color: s.sub, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
            {isSignUp ? '既にアカウントをお持ちの方はこちら' : 'アカウントを作成する'}
          </button>
        </div>
      </div>
    </div>
  )
}