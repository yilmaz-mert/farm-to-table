'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { MapPin, Search, Snowflake, Truck, X } from 'lucide-react'
import { matchCity, tierLabel, type CityInfo } from '@/lib/shipping'

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

export function ShippingCalculator() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<CityInfo | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const reduced = useReducedMotion() ?? false

  const results = matchCity(query).slice(0, 8)

  // Close dropdown on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function selectCity(city: CityInfo) {
    setSelected(city)
    setQuery('')
    setOpen(false)
  }

  function clearSelection() {
    setSelected(null)
    setQuery('')
    inputRef.current?.focus()
  }

  const nextDay = selected?.tier === 'next-day'

  return (
    <section className="border-y border-border bg-raised py-16" aria-label="Teslimat süresi hesaplama">
      <div className="container-page">
        <div className="mx-auto max-w-xl">
          {/* Header */}
          <div className="mb-7 text-center">
            <p className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent">
              Teslimat süresi
            </p>
            <h2 className="font-serif text-3xl font-light italic text-text">
              Şehrini seç, <span className="text-primary">kapına ne zaman geleceğini gör.</span>
            </h2>
          </div>

          {/* Search / select */}
          <div ref={rootRef} className="relative">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 shadow-sm focus-within:border-border-strong">
              <Search className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
              {selected ? (
                <div className="flex h-12 flex-1 items-center justify-between">
                  <span className="flex items-center gap-2 font-sans text-sm font-medium text-text">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden />
                    {selected.name}
                    <span className="text-subtle">· {selected.region}</span>
                  </span>
                  <button
                    onClick={clearSelection}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-text"
                    aria-label="Şehir seçimini temizle"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setOpen(true)
                  }}
                  onFocus={() => setOpen(true)}
                  placeholder="İstanbul, Ankara, Sakarya…"
                  className="h-12 flex-1 bg-transparent font-sans text-sm text-text outline-none placeholder:text-subtle"
                  role="combobox"
                  aria-expanded={open}
                  aria-controls="city-listbox"
                  aria-label="Şehir ara"
                />
              )}
            </div>

            {/* Dropdown */}
            <AnimatePresence>
              {open && !selected && (
                <motion.ul
                  id="city-listbox"
                  role="listbox"
                  initial={reduced ? false : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16, ease }}
                  className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-border bg-surface py-1.5 shadow-lg"
                >
                  {results.length === 0 ? (
                    <li className="px-4 py-3 font-sans text-sm text-muted">
                      Eşleşen şehir bulunamadı — yazımı kontrol edin.
                    </li>
                  ) : (
                    results.map((city) => (
                      <li key={city.name} role="option" aria-selected={false}>
                        <button
                          onClick={() => selectCity(city)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-raised"
                        >
                          <span className="font-sans text-sm font-medium text-text">
                            {city.name}
                          </span>
                          <span className="font-sans text-xs text-subtle">{city.region}</span>
                        </button>
                      </li>
                    ))
                  )}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Result card */}
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.name}
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease }}
                className="mt-5 overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
              >
                {/* Delivery window */}
                <div className="flex items-center gap-4 p-5">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      nextDay ? 'bg-verdigris-100 dark:bg-verdigris-900' : 'bg-cherry-wash'
                    }`}
                  >
                    <Truck
                      className={`h-5 w-5 ${nextDay ? 'text-verdigris-700 dark:text-verdigris-300' : 'text-primary'}`}
                      aria-hidden
                    />
                  </div>
                  <div>
                    <p className="font-sans text-base font-semibold text-text">
                      {tierLabel(selected.tier)}
                    </p>
                    <p className="mt-0.5 font-sans text-sm text-muted">
                      {selected.region} bölgesi — sabah hasadı{' '}
                      {nextDay ? 'ertesi gün kapınızda' : '1–2 iş günü içinde kapınızda'}.
                    </p>
                  </div>
                </div>

                {/* Cold-chain assurance */}
                <div className="flex items-center gap-3 border-t border-border bg-raised px-5 py-3.5">
                  <Snowflake className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <p className="font-sans text-xs leading-relaxed text-muted">
                    Her kutu EPS yalıtım ve jel buz ile çıkar; soğuk zincir{' '}
                    <span className="font-medium text-text">yolculuk boyunca +4 °C</span>{' '}
                    bandında korunur.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
