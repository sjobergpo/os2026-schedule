import type { ProcessedSchedule } from '../data'

const SPORT_COLOR_MAP: Record<string, string> = {
  'Alpine': 'var(--sport-alpine)',
  'Biathlon': 'var(--sport-biathlon)',
  'Bobsled': 'var(--sport-bobsled)',
  'Ceremony': 'var(--sport-ceremony)',
  'Cross-Country': 'var(--sport-cross-country)',
  'Curling': 'var(--sport-curling)',
  'Figure Skating': 'var(--sport-figure-skating)',
  'Freestyle': 'var(--sport-freestyle)',
  'General': 'var(--sport-general)',
  'Ice Hockey': 'var(--sport-ice-hockey)',
  'Luge': 'var(--sport-luge)',
  'Nordic Combined': 'var(--sport-nordic-combined)',
  'Short Track': 'var(--sport-short-track)',
  'Skeleton': 'var(--sport-skeleton)',
  'Ski Jumping': 'var(--sport-ski-jumping)',
  'Ski Mountaineering': 'var(--sport-ski-mountaineering)',
  'Snowboard': 'var(--sport-snowboard)',
  'Speed Skating': 'var(--sport-speed-skating)',
}

const SPORT_SWEDISH: Record<string, string> = {
  'Alpine': 'Alpin',
  'Biathlon': 'Skidskytte',
  'Bobsled': 'Bob',
  'Ceremony': 'Ceremoni',
  'Cross-Country': 'Längdskidor',
  'Curling': 'Curling',
  'Figure Skating': 'Konståkning',
  'Freestyle': 'Freestyle',
  'General': 'Allmänt',
  'Ice Hockey': 'Ishockey',
  'Luge': 'Rodel',
  'Nordic Combined': 'Nordisk kombination',
  'Short Track': 'Kortbaneskridskor',
  'Skeleton': 'Skeleton',
  'Ski Jumping': 'Backhoppning',
  'Ski Mountaineering': 'Skidalpinism',
  'Snowboard': 'Snowboard',
  'Speed Skating': 'Skridskor',
}

export function sportSwedish(sport: string): string {
  return SPORT_SWEDISH[sport] ?? sport
}

export { SPORT_COLOR_MAP }

export function initNavigation(
  schedule: ProcessedSchedule,
  onDayChange: (date: string) => void
): { setActiveDate: (date: string) => void } {
  const nav = document.getElementById('date-nav')!

  // Count finals per day
  const finalsPerDay = new Map<string, number>()
  for (const day of schedule.days) {
    finalsPerDay.set(day.date, day.entries.filter(e => e.isFinal).length)
  }

  const pills: HTMLButtonElement[] = []

  for (const day of schedule.days) {
    const btn = document.createElement('button')
    btn.className = 'date-pill'
    btn.setAttribute('role', 'tab')
    btn.dataset.date = day.date

    const labelSpan = document.createElement('span')
    labelSpan.textContent = day.label
    btn.appendChild(labelSpan)

    const fc = finalsPerDay.get(day.date) ?? 0
    if (fc > 0) {
      const badge = document.createElement('span')
      badge.className = 'finals-count'
      badge.textContent = `\u2605${fc}`
      btn.appendChild(badge)
    }

    btn.addEventListener('click', () => {
      setActiveDate(day.date)
      onDayChange(day.date)
    })

    pills.push(btn)
    nav.appendChild(btn)
  }

  // Keyboard nav
  nav.addEventListener('keydown', (e) => {
    const active = nav.querySelector('.date-pill.active') as HTMLButtonElement | null
    if (!active) return
    const idx = pills.indexOf(active)
    if (e.key === 'ArrowRight' && idx < pills.length - 1) {
      e.preventDefault()
      pills[idx + 1].click()
      pills[idx + 1].focus()
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault()
      pills[idx - 1].click()
      pills[idx - 1].focus()
    }
  })

  function setActiveDate(date: string) {
    for (const p of pills) {
      const isActive = p.dataset.date === date
      p.classList.toggle('active', isActive)
      p.setAttribute('aria-selected', String(isActive))
      p.setAttribute('tabindex', isActive ? '0' : '-1')
    }
    window.location.hash = date
    // Scroll active pill into view
    const active = pills.find(p => p.dataset.date === date)
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  // Determine initial date
  const today = new Date().toISOString().slice(0, 10)
  const hashDate = window.location.hash.slice(1)
  let initialDate: string
  if (hashDate && schedule.dates.includes(hashDate)) {
    initialDate = hashDate
  } else if (schedule.dates.includes(today)) {
    initialDate = today
  } else {
    initialDate = schedule.dates[1] ?? schedule.dates[0] // Feb 7 or first
  }

  setActiveDate(initialDate)
  onDayChange(initialDate)

  return { setActiveDate }
}
