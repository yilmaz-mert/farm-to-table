'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type State = 'idle' | 'loading' | 'success' | 'error'

interface Props {
  email: string
}

export function SuccessAccountWidget({ email }: Props) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleCreate() {
    if (password.length < 8) {
      setErrorMsg('Şifre en az 8 karakter olmalıdır.')
      return
    }
    setState('loading')
    setErrorMsg('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (!error) {
      setState('success')
      return
    }

    if (
      error.message.toLowerCase().includes('already registered') ||
      error.message.toLowerCase().includes('already exists') ||
      error.message.toLowerCase().includes('user already')
    ) {
      setErrorMsg('Bu e-posta ile zaten bir hesap var. Giriş sayfasından devam edin.')
    } else {
      setErrorMsg(error.message)
    }
    setState('error')
  }

  if (state === 'success') {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-verdigris-200 bg-verdigris-50 px-5 py-4 dark:border-verdigris-800 dark:bg-verdigris-950">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-verdigris-600 dark:text-verdigris-400" aria-hidden />
        <p className="font-sans text-sm text-verdigris-800 dark:text-verdigris-300">
          Hesabınız oluşturuldu! Siparişlerinizi takip edebilirsiniz.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-2xl border border-border bg-surface px-5 py-4">
      <p className="mb-1 font-sans text-sm font-semibold text-text">
        Hesap oluşturun
      </p>
      <p className="mb-4 font-sans text-xs text-muted">
        {email} adresi ile siparişlerinizi takip edin.
      </p>

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Şifre (en az 8 karakter)"
          className="w-full rounded-xl border border-border bg-raised px-4 py-3 pr-11 font-sans text-sm text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/40"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          disabled={state === 'loading'}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle transition-colors hover:text-muted"
          aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {errorMsg && (
        <p className="mt-2 font-sans text-xs text-red-500">{errorMsg}</p>
      )}

      <button
        onClick={handleCreate}
        disabled={state === 'loading' || !password}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-sans text-sm font-semibold text-white transition-opacity disabled:opacity-50"
      >
        {state === 'loading' ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        {state === 'loading' ? 'Oluşturuluyor…' : 'Hesap Oluştur'}
      </button>
    </div>
  )
}
