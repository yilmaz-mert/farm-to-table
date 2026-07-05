/**
 * Ambient section background image, admin-editable (see /admin/settings →
 * Görsel ve Medya Yönetimi). Renders nothing when no URL is set — every
 * consuming section keeps its current plain design as the default.
 *
 * Deliberately CSS background-image, not next/image: this project doesn't
 * have `sharp` installed, and next/image's optimizer falls back to a much
 * slower path without it — for a handful of admin-uploaded section
 * backgrounds, a plain compositor-friendly layer is the safer default.
 * `transform-gpu` promotes it to its own compositing layer so it doesn't
 * repaint on every scroll frame; `background-attachment: fixed` is
 * deliberately avoided since that's a well-known scroll-jank cause.
 */
export function SectionBackground({
  imageUrl,
  overlayClassName = 'bg-background/85',
}: {
  imageUrl?: string | null
  /** Scrim between the photo and content — keep text legible over any photo. */
  overlayClassName?: string
}) {
  if (!imageUrl) return null

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 origin-center transform-gpu bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className={`absolute inset-0 ${overlayClassName}`} />
    </div>
  )
}
