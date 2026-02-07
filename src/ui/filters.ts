import type { ProcessedSchedule, ActiveFilters } from '../data'
import { SPORT_COLOR_MAP, sportSwedish } from './navigation'

export function initFilters(
  schedule: ProcessedSchedule,
  onChange: (filters: ActiveFilters) => void
): { getFilters: () => ActiveFilters } {
  const filters: ActiveFilters = {
    sports: new Set<string>(),
    channels: new Set<string>(),
    finalsOnly: false,
  }

  const filterBar = document.getElementById('filter-bar')!
  const sportGroup = document.getElementById('sport-filters')!
  const channelGroup = document.getElementById('channel-filters')!
  const finalsGroup = document.getElementById('finals-filter-group')!
  const toggleBtn = document.getElementById('filter-toggle')!

  // Mobile collapse
  let collapsed = window.innerWidth <= 768
  if (collapsed) filterBar.classList.add('collapsed')

  toggleBtn.addEventListener('click', () => {
    collapsed = !collapsed
    filterBar.classList.toggle('collapsed', collapsed)
    toggleBtn.textContent = collapsed ? 'Filter \u25BC' : 'Filter \u25B2'
  })
  toggleBtn.textContent = collapsed ? 'Filter \u25BC' : 'Filter \u25B2'

  // Finals toggle
  const finalsChip = document.createElement('button')
  finalsChip.className = 'filter-chip finals-toggle'
  finalsChip.textContent = '\u2605 Finaler'
  finalsChip.addEventListener('click', () => {
    filters.finalsOnly = !filters.finalsOnly
    finalsChip.classList.toggle('active', filters.finalsOnly)
    onChange(filters)
  })
  finalsGroup.appendChild(finalsChip)

  // Sport chips
  for (const sport of schedule.sports) {
    const chip = document.createElement('button')
    chip.className = 'filter-chip'
    chip.textContent = sportSwedish(sport)
    chip.dataset.sport = sport

    chip.addEventListener('click', () => {
      if (filters.sports.has(sport)) {
        filters.sports.delete(sport)
        chip.classList.remove('active')
        chip.style.background = ''
        chip.style.color = ''
      } else {
        filters.sports.add(sport)
        chip.classList.add('active')
        const color = SPORT_COLOR_MAP[sport] ?? 'var(--text-muted)'
        chip.style.background = color
        chip.style.color = '#000'
      }
      onChange(filters)
    })

    sportGroup.appendChild(chip)
  }

  // Channel chips
  for (const ch of schedule.channels) {
    const chip = document.createElement('button')
    chip.className = 'filter-chip'
    chip.textContent = ch
    chip.dataset.channel = ch

    chip.addEventListener('click', () => {
      if (filters.channels.has(ch)) {
        filters.channels.delete(ch)
        chip.classList.remove('active')
        chip.style.background = ''
      } else {
        filters.channels.add(ch)
        chip.classList.add('active')
        chip.style.background = 'var(--text-primary)'
        chip.style.color = 'var(--bg-primary)'
      }
      onChange(filters)
    })

    channelGroup.appendChild(chip)
  }

  return { getFilters: () => filters }
}
