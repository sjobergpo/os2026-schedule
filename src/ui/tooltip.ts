import type { ScheduleEntry } from '../data'
import { sportSwedish } from './navigation'

const tooltip = () => document.getElementById('tooltip')!

function formatTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

export function showTooltip(entry: ScheduleEntry, rect: DOMRect): void {
  const el = tooltip()
  el.innerHTML = ''

  const sportEl = document.createElement('div')
  sportEl.className = 'tooltip-sport'
  sportEl.textContent = sportSwedish(entry.sport) + (entry.hasSweden ? ' \uD83C\uDDF8\uD83C\uDDEA' : '')
  el.appendChild(sportEl)

  const eventEl = document.createElement('div')
  eventEl.className = 'tooltip-event'
  eventEl.textContent = entry.event
  el.appendChild(eventEl)

  const timeEl = document.createElement('div')
  timeEl.className = 'tooltip-time'
  timeEl.textContent = `${formatTime(entry.startMinutes)} – ${formatTime(entry.endMinutes)}`
  el.appendChild(timeEl)

  const channelEl = document.createElement('div')
  channelEl.className = 'tooltip-channel'
  channelEl.textContent = entry.channel === 'TV4' ? 'TV4 Play' : 'SVT Play'
  el.appendChild(channelEl)

  if (entry.isFinal) {
    const finalEl = document.createElement('div')
    finalEl.className = 'tooltip-final'
    finalEl.textContent = '\u2605 Final / Medaljavgörande'
    el.appendChild(finalEl)
  }

  el.classList.add('visible')

  // Position
  const vw = window.innerWidth
  const vh = window.innerHeight
  let left = rect.left + rect.width / 2
  let top = rect.bottom + 8

  el.style.left = `${left}px`
  el.style.top = `${top}px`

  // Adjust after render
  requestAnimationFrame(() => {
    const tr = el.getBoundingClientRect()
    if (tr.right > vw - 8) left = vw - tr.width - 8
    if (left < 8) left = 8
    if (tr.bottom > vh - 8) top = rect.top - tr.height - 8
    el.style.left = `${left}px`
    el.style.top = `${top}px`
  })
}

export function hideTooltip(): void {
  tooltip().classList.remove('visible')
}
