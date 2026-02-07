import type { DaySchedule, ScheduleEntry, ActiveFilters } from '../data'
import { SPORT_COLOR_MAP, sportSwedish } from './navigation'
import { showTooltip, hideTooltip } from './tooltip'

function formatTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

function getPxPerHour(): number {
  const val = getComputedStyle(document.documentElement).getPropertyValue('--px-per-hour').trim()
  return parseInt(val) || 120
}

function isPassingFilter(entry: ScheduleEntry, filters: ActiveFilters): boolean {
  if (entry.isGeneral) return true
  if (filters.finalsOnly && !entry.isFinal) return false
  if (filters.sports.size > 0 && !filters.sports.has(entry.sport)) return false
  if (filters.channels.size > 0 && !filters.channels.has(entry.channel)) return false
  return true
}

let nowInterval: number | null = null

export function renderTimeline(day: DaySchedule, filters: ActiveFilters): void {
  const container = document.getElementById('timeline')!
  container.innerHTML = ''

  if (nowInterval) {
    clearInterval(nowInterval)
    nowInterval = null
  }

  const pxPerHour = getPxPerHour()
  const pxPerMinute = pxPerHour / 60
  const totalMinutes = day.timeRangeEnd - day.timeRangeStart
  const totalWidth = totalMinutes * pxPerMinute

  container.style.width = `${totalWidth}px`
  container.style.minHeight = `${28 + day.laneCount * 44 + 20}px`

  // Hour header
  const header = document.createElement('div')
  header.className = 'timeline-header'
  header.style.width = `${totalWidth}px`

  for (let min = day.timeRangeStart; min <= day.timeRangeEnd; min += 30) {
    const x = (min - day.timeRangeStart) * pxPerMinute
    const isFullHour = min % 60 === 0

    if (isFullHour) {
      const label = document.createElement('span')
      label.className = 'hour-label'
      label.style.left = `${x}px`
      label.textContent = formatTime(min)
      header.appendChild(label)
    }
  }
  container.appendChild(header)

  // Body
  const body = document.createElement('div')
  body.className = 'timeline-body'
  body.style.width = `${totalWidth}px`

  // Hour lines
  for (let min = day.timeRangeStart; min <= day.timeRangeEnd; min += 30) {
    const x = (min - day.timeRangeStart) * pxPerMinute
    const line = document.createElement('div')
    line.className = min % 60 === 0 ? 'hour-line' : 'hour-line half'
    line.style.left = `${x}px`
    body.appendChild(line)
  }

  // Separate generals and regulars
  const generals = day.entries.filter(e => e.isGeneral)
  const regulars = day.entries.filter(e => !e.isGeneral)

  // Count general lanes
  const generalLaneCount = generals.length > 0 ? Math.max(...generals.map(e => e.lane)) + 1 : 0

  // General lanes
  for (let i = 0; i < generalLaneCount; i++) {
    const row = document.createElement('div')
    row.className = 'lane-row general-lane'
    row.style.top = `${i * 32}px`
    row.style.width = `${totalWidth}px`

    const laneEntries = generals.filter(e => e.lane === i)
    for (const entry of laneEntries) {
      const bar = createEventBar(entry, day.timeRangeStart, pxPerMinute, filters)
      row.appendChild(bar)
    }
    body.appendChild(row)
  }

  // Regular lanes
  const regularOffset = generalLaneCount * 32
  const maxRegularLane = regulars.length > 0 ? Math.max(...regulars.map(e => e.lane)) : generalLaneCount - 1

  for (let lane = generalLaneCount; lane <= maxRegularLane; lane++) {
    const row = document.createElement('div')
    row.className = 'lane-row'
    row.style.position = 'relative'
    row.style.top = `${regularOffset + (lane - generalLaneCount) * 44}px`

    const laneEntries = regulars.filter(e => e.lane === lane)
    for (const entry of laneEntries) {
      const bar = createEventBar(entry, day.timeRangeStart, pxPerMinute, filters)
      row.appendChild(bar)
    }
    body.appendChild(row)
  }

  const totalHeight = regularOffset + (maxRegularLane - generalLaneCount + 1) * 44 + 20
  body.style.height = `${totalHeight}px`

  // NOW line
  const today = new Date().toISOString().slice(0, 10)
  if (day.date === today) {
    const addNowLine = () => {
      const existing = body.querySelector('.now-line')
      if (existing) existing.remove()

      const now = new Date()
      const nowMin = now.getHours() * 60 + now.getMinutes()
      if (nowMin >= day.timeRangeStart && nowMin <= day.timeRangeEnd) {
        const x = (nowMin - day.timeRangeStart) * pxPerMinute
        const nowLine = document.createElement('div')
        nowLine.className = 'now-line'
        nowLine.style.left = `${x}px`

        const nowLabel = document.createElement('span')
        nowLabel.className = 'now-label'
        nowLabel.textContent = 'NU'
        nowLine.appendChild(nowLabel)

        body.appendChild(nowLine)
      }
    }
    addNowLine()
    nowInterval = window.setInterval(addNowLine, 60000)
  }

  container.appendChild(body)

  // Update finals summary
  updateFinalsSummary(day, filters)
}

function createEventBar(
  entry: ScheduleEntry,
  timeRangeStart: number,
  pxPerMinute: number,
  filters: ActiveFilters
): HTMLDivElement {
  const bar = document.createElement('div')
  bar.className = 'event-bar'

  const left = (entry.startMinutes - timeRangeStart) * pxPerMinute
  const width = Math.max(entry.durationMinutes * pxPerMinute, 60)
  bar.style.left = `${left}px`
  bar.style.width = `${width}px`

  const color = SPORT_COLOR_MAP[entry.sport] ?? 'var(--text-muted)'
  bar.style.background = color

  if (entry.isGeneral) {
    bar.classList.add('general-bar')
  }

  if (entry.isFinal) {
    bar.classList.add('is-final')
  }

  if (!isPassingFilter(entry, filters)) {
    bar.classList.add('filtered-out')
  }

  // Accessible attributes
  bar.setAttribute('role', 'button')
  bar.setAttribute('tabindex', '0')
  const sportSv = sportSwedish(entry.sport)
  const swedenFlag = entry.hasSweden ? ' \uD83C\uDDF8\uD83C\uDDEA' : ''
  const ariaText = `${sportSv}: ${entry.event}, ${formatTime(entry.startMinutes)}-${formatTime(entry.endMinutes)}, ${entry.channel}${entry.isFinal ? ', Final' : ''}${swedenFlag}`
  bar.setAttribute('aria-label', ariaText)

  // Content - textContent only, no innerHTML (XSS safe)
  if (entry.isFinal) {
    const star = document.createElement('span')
    star.className = 'finals-star'
    star.textContent = '\u2605'
    bar.appendChild(star)
  }

  if (entry.hasSweden) {
    const flag = document.createElement('span')
    flag.className = 'sweden-flag'
    flag.textContent = '\uD83C\uDDF8\uD83C\uDDEA'
    bar.appendChild(flag)
  }

  const name = document.createElement('span')
  name.className = 'event-name'
  name.textContent = entry.isGeneral ? entry.event : sportSv
  bar.appendChild(name)

  if (entry.channel === 'TV4') {
    const badge = document.createElement('span')
    badge.className = 'channel-badge'
    badge.textContent = 'TV4'
    bar.appendChild(badge)
  }

  // Tooltip events
  let hoverTimer: number | null = null
  bar.addEventListener('mouseenter', () => {
    hoverTimer = window.setTimeout(() => {
      showTooltip(entry, bar.getBoundingClientRect())
    }, 150)
  })
  bar.addEventListener('mouseleave', () => {
    if (hoverTimer) clearTimeout(hoverTimer)
    hideTooltip()
  })
  bar.addEventListener('click', () => {
    showTooltip(entry, bar.getBoundingClientRect())
  })
  bar.addEventListener('focus', () => {
    showTooltip(entry, bar.getBoundingClientRect())
  })
  bar.addEventListener('blur', () => {
    hideTooltip()
  })

  return bar
}

function updateFinalsSummary(day: DaySchedule, filters: ActiveFilters): void {
  const container = document.getElementById('finals-summary')!
  container.innerHTML = ''

  const finals = day.entries.filter(e => e.isFinal && isPassingFilter(e, filters))
  if (finals.length === 0) {
    container.style.display = 'none'
    return
  }

  container.style.display = 'flex'

  const label = document.createElement('span')
  label.className = 'finals-summary-label'
  label.textContent = `\u2605 ${finals.length} ${finals.length === 1 ? 'final' : 'finaler'}:`
  container.appendChild(label)

  const seen = new Set<string>()
  for (const f of finals) {
    if (seen.has(f.sport)) continue
    seen.add(f.sport)

    const tag = document.createElement('span')
    tag.className = 'finals-summary-sport'
    const color = SPORT_COLOR_MAP[f.sport] ?? 'var(--text-muted)'
    tag.style.background = color
    tag.textContent = sportSwedish(f.sport)
    container.appendChild(tag)
  }
}
