sx
'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function Auth() {
  return (
    <Suspense fallback={<main className="page"><section className="section"><div className="container">Loading…</div></section></main>}>
      <AuthForm />
    </Suspense>
  )
}

function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notConfigured, setNotConfigured] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/post'

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) { setNotConfigured(true); return }
    supabase.auth.getUser().then(({ data }) => { if (data.user) router.replace(next) })
  }, [router, next])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const supabase = getSupabase()
    if (!supabase) { setNotConfigured(true); return }
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
        if (data.user) {
          await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName, phone })
        }
        if (!data.session) {
          setError('Account created. Check your email to confirm, then log in.')
          setMode('login')
          setBusy(false)
          return
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      }
      router.push(next)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page">
      <section className="section">
        <div className="container" style={{ maxWidth: 520 }}>
          <div className="panel">
            <div className="eyebrow">HAMA ACCOUNT</div>
            <h1 style={{ margin: '6px 0 8px' }}>{mode === 'login' ? 'Welcome back' : 'Create your Hama account'}</h1>
            <p className="muted">
              {mode === 'login' ? 'Log in to post a house or manage your listings.' : 'You need an account to post a house — this is who tenants will contact.'}
            </p>

            {notConfigured && (
              <div className="notice" style={{ marginTop: 12 }}>
                ⚠️ Supabase isn&apos;t configured on this deployment yet (missing env vars). Auth won&apos;t work until that&apos;s set up — see SETUP.md.
              </div>
            )}

            <form className="form" onSubmit={submit}>
              {mode === 'signup' && (
                <>
                  <input className="field" placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} required />
                  <input className="field" placeholder="Phone (e.g. 0712 345 678)" value={phone} onChange={e => setPhone(e.target.value)} required />
                </>
              )}
              <input className="field" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <input className="field" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              {error && <div className="notice" style={{ color: '#b3261e' }}>{error}</div>}
              <button className="btn btn-primary" type="submit" disabled={busy || notConfigured}>
                {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { setError(''); setMode(mode === 'login' ? 'signup' : 'login') }}>
                {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}

