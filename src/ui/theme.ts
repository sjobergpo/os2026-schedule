const STORAGE_KEY = 'os2026-theme'

export function initTheme(): void {
  const saved = localStorage.getItem(STORAGE_KEY)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isLight = saved === 'light' || (!saved && !prefersDark)

  if (isLight) document.documentElement.classList.add('light-mode')
  updateIcon()

  const btn = document.getElementById('theme-toggle')!
  btn.addEventListener('click', () => {
    document.documentElement.classList.toggle('light-mode')
    const light = document.documentElement.classList.contains('light-mode')
    localStorage.setItem(STORAGE_KEY, light ? 'light' : 'dark')
    updateIcon()
  })
}

function updateIcon(): void {
  const btn = document.getElementById('theme-toggle')!
  const isLight = document.documentElement.classList.contains('light-mode')
  btn.textContent = isLight ? '\u2600\uFE0F' : '\uD83C\uDF19'
}
