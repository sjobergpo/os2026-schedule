import '../styles/variables.css'
import '../styles/layout.css'
import '../styles/timeline.css'
import '../styles/components.css'

import scheduleData from '../data/schedule-data.json'
import { processSchedule } from '../data'
import type { ActiveFilters } from '../data'
import { initTheme } from './theme'
import { initNavigation } from './navigation'
import { initFilters } from './filters'
import { renderTimeline } from './timeline'
import { hideTooltip } from './tooltip'

const schedule = processSchedule(scheduleData as unknown[])

let currentDate = schedule.dates[1] ?? schedule.dates[0]
let currentFilters: ActiveFilters = {
  sports: new Set(),
  channels: new Set(),
  finalsOnly: false,
}

function render() {
  const day = schedule.days.find(d => d.date === currentDate)
  if (!day) return
  hideTooltip()
  renderTimeline(day, currentFilters)
}

initTheme()

initNavigation(schedule, (date) => {
  currentDate = date
  render()
})

initFilters(schedule, (filters) => {
  currentFilters = filters
  render()
})

// Dismiss tooltip on outside click
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  if (!target.closest('.event-bar') && !target.closest('.tooltip')) {
    hideTooltip()
  }
})

// Handle hash changes
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1)
  if (hash && schedule.dates.includes(hash) && hash !== currentDate) {
    currentDate = hash
    render()
  }
})
