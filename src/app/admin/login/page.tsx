'use client'

import { useState } from 'react'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('E-posta ve şifre gereklidir.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authError) {
        setError('E-posta veya şifre hatalı.')
        setLoading(false)
        return
      }
      if (!data?.session) {
        setError('Oturum başlatılamadı. Lütfen tekrar deneyin.')
        setLoading(false)
        return
      }
      // Force a full navigation so middleware and server components see the
      // freshly-set session cookies — a soft router.push can render before
      // the new cookies are attached to the next request.
      window.location.href = '/admin'
    } catch {
      setError('Giriş yapılamadı. Lütfen tekrar deneyin.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Brand */}
      <div className="mb-10 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
          Dalından Kapıya
        </p>
        <h1 className="mt-2 font-serif text-3xl font-light italic text-text">
          Yönetim Paneli
        </h1>
        <p className="mt-2 font-sans text-sm text-muted">Devam etmek için giriş yapın.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block font-sans text-xs font-medium text-muted"
          >
            E-posta
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError('')
            }}
            placeholder="admin@dalindankapiya.com.tr"
            autoComplete="email"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 font-sans text-sm text-text placeholder:text-subtle outline-none transition-colors focus:border-primary"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block font-sans text-xs font-medium text-muted"
          >
            Şifre
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError('')
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 pr-11 font-sans text-sm text-text placeholder:text-subtle outline-none transition-colors focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-muted"
              aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-800/30 bg-red-950/30 px-3 py-2.5 font-sans text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-sans text-sm font-semibold text-inverted transition-opacity disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="dark flex min-h-dvh flex-col items-center justify-center bg-background px-5">
      <LoginForm />
    </div>
  )
}
