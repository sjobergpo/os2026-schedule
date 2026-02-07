import type { RawScheduleEntry, ScheduleEntry, DaySchedule, ProcessedSchedule } from './types'

const SWEDISH_DAYS = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function formatLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = SWEDISH_DAYS[d.getDay()]
  return `${day} ${d.getDate()} feb`
}

function validateEntry(e: unknown, i: number): RawScheduleEntry {
  const entry = e as Record<string, unknown>
  if (!entry.date || !entry.start || !entry.end || !entry.sport || !entry.event) {
    throw new Error(`Invalid entry at index ${i}: missing required fields`)
  }
  if (entry.channel !== 'SVT' && entry.channel !== 'TV4') {
    throw new Error(`Invalid channel "${entry.channel}" at index ${i}`)
  }
  if (typeof entry.isFinal !== 'boolean') {
    throw new Error(`Invalid isFinal at index ${i}`)
  }
  if (typeof entry.hasSweden !== 'boolean') {
    throw new Error(`Invalid hasSweden at index ${i}`)
  }
  return entry as unknown as RawScheduleEntry
}

function parseEntries(raw: unknown[]): ScheduleEntry[] {
  const seen = new Map<string, number>()

  return raw.map((r, i) => {
    const entry = validateEntry(r, i)
    const startMinutes = parseTime(entry.start)
    let endMinutes = parseTime(entry.end)
    if (endMinutes <= startMinutes) endMinutes += 1440

    const baseId = `${entry.date}-${entry.start}-${slugify(entry.sport)}-${slugify(entry.event)}`
    const count = seen.get(baseId) ?? 0
    seen.set(baseId, count + 1)
    const id = count > 0 ? `${baseId}-${count}` : baseId

    return {
      id,
      date: entry.date,
      startMinutes,
      endMinutes,
      durationMinutes: endMinutes - startMinutes,
      sport: entry.sport,
      event: entry.event,
      channel: entry.channel,
      isFinal: entry.isFinal,
      isGeneral: entry.sport === 'General' || entry.sport === 'Ceremony',
      hasSweden: entry.hasSweden,
      lane: 0,
    }
  })
}

export function assignLanes(entries: ScheduleEntry[]): void {
  const generals = entries.filter(e => e.isGeneral)
  const regulars = entries.filter(e => !e.isGeneral)

  let nextGeneralLane = 0
  for (const g of generals) {
    g.lane = nextGeneralLane++
  }
  const offset = nextGeneralLane

  regulars.sort((a, b) => a.startMinutes - b.startMinutes || b.durationMinutes - a.durationMinutes)

  const laneEnds: number[] = []
  for (const entry of regulars) {
    let placed = false
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i] <= entry.startMinutes) {
        entry.lane = i + offset
        laneEnds[i] = entry.endMinutes
        placed = true
        break
      }
    }
    if (!placed) {
      entry.lane = laneEnds.length + offset
      laneEnds.push(entry.endMinutes)
    }
  }
}

export function recomputeLanes(entries: ScheduleEntry[]): ScheduleEntry[] {
  const cloned = entries.map(e => ({ ...e, lane: 0 }))
  assignLanes(cloned)
  return cloned
}

export function processSchedule(raw: unknown[]): ProcessedSchedule {
  const entries = parseEntries(raw)

  const grouped = new Map<string, ScheduleEntry[]>()
  for (const e of entries) {
    const list = grouped.get(e.date) ?? []
    list.push(e)
    grouped.set(e.date, list)
  }

  const sortedDates = [...grouped.keys()].sort()
  const allSports = new Set<string>()
  const allChannels = new Set<"SVT" | "TV4">()

  const days: DaySchedule[] = sortedDates.map(date => {
    const dayEntries = grouped.get(date)!
    assignLanes(dayEntries)

    for (const e of dayEntries) {
      if (!e.isGeneral) allSports.add(e.sport)
      allChannels.add(e.channel)
    }

    const starts = dayEntries.map(e => e.startMinutes)
    const ends = dayEntries.map(e => e.endMinutes)
    const minStart = Math.min(...starts)
    const maxEnd = Math.max(...ends)

    const timeRangeStart = Math.max(Math.floor(minStart / 60) * 60, 480)
    const timeRangeEnd = Math.ceil(maxEnd / 60) * 60

    const maxLane = Math.max(...dayEntries.map(e => e.lane))

    dayEntries.sort((a, b) => a.startMinutes - b.startMinutes || a.lane - b.lane)

    return {
      date,
      label: formatLabel(date),
      entries: dayEntries,
      laneCount: maxLane + 1,
      timeRangeStart,
      timeRangeEnd,
    }
  })

  return {
    days,
    sports: [...allSports].sort(),
    dates: sortedDates,
    channels: [...allChannels].sort() as ("SVT" | "TV4")[],
  }
}
