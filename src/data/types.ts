export interface RawScheduleEntry {
  date: string
  start: string
  end: string
  sport: string
  event: string
  channel: "SVT" | "TV4"
  isFinal: boolean
  hasSweden: boolean
}

export interface ScheduleEntry {
  id: string
  date: string
  startMinutes: number
  endMinutes: number
  durationMinutes: number
  sport: string
  event: string
  channel: "SVT" | "TV4"
  isFinal: boolean
  isGeneral: boolean
  hasSweden: boolean
  lane: number
}

export interface DaySchedule {
  date: string
  label: string
  entries: ScheduleEntry[]
  laneCount: number
  timeRangeStart: number
  timeRangeEnd: number
}

export interface ProcessedSchedule {
  days: DaySchedule[]
  sports: string[]
  dates: string[]
  channels: ("SVT" | "TV4")[]
}

export interface ActiveFilters {
  sports: Set<string>
  channels: Set<string>
  finalsOnly: boolean
}
