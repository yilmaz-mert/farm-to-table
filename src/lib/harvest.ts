/**
 * Weekend Blackout Rule.
 * Cherries must not sit in a courier depot over the weekend. Orders placed
 * Friday after 12:00, or any time Saturday/Sunday, are scheduled for the
 * next Monday-morning harvest instead of shipping immediately.
 */

export interface BlackoutInfo {
  active: boolean
  /** Human-readable Turkish notice shown next to the add-to-cart action. */
  notice: string | null
}

export function getBlackoutInfo(now: Date = new Date()): BlackoutInfo {
  const day = now.getDay() // 0 = Sunday … 6 = Saturday
  const fridayAfternoon = day === 5 && now.getHours() >= 12
  const weekend = day === 6 || day === 0

  if (fridayAfternoon || weekend) {
    return {
      active: true,
      notice:
        'Siparişiniz koruma altında: meyveniz yolda beklemesin diye Pazartesi sabah hasadıyla yola çıkacak.',
    }
  }

  return { active: false, notice: null }
}
