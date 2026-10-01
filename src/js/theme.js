// Theme control: one three-way switch (Light | System | Dark) rendered by the
// board's theme card and by every page's floating pills. The visible state is
// the root data-theme attribute; a pinned mode is applied before first paint by
// an inline script in the document head.
const STORAGE_KEY = 'theme-preference'
const MODES = ['auto', 'light', 'dark']

const ICON_PATHS = {
  light: '<circle cx="12" cy="12" r="4.1" /><path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />',
  auto: '<rect x="4" y="5.2" width="16" height="10.6" rx="2" /><path d="M2.2 19h19.6" />',
  dark: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />'
}

const LABELS = { light: 'Light', auto: 'Auto (system)', dark: 'Dark' }

function icon(name) {
  return `<svg class="theme-switch__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]}</svg>`
}

function readStoredMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return MODES.includes(stored) ? stored : 'auto'
  } catch {
    return 'auto'
  }
}

let mode = readStoredMode()

function setMode(next) {
  mode = MODES.includes(next) ? next : 'auto'
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {}
  paint()
}

function paint() {
  const root = document.documentElement
  if (mode === 'auto') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', mode)
  }

  for (const option of document.querySelectorAll('[data-theme-set]')) {
    option.setAttribute('aria-pressed', String(option.dataset.themeSet === mode))
  }
}

// The three-way switch: system sits in the neutral middle, between light and
// dark, and the pinned segment keeps the inverted surface.
export function themeSwitch() {
  const option = value => `<button type="button" class="theme-switch__option" data-theme-set="${value}" title="${LABELS[value]}" aria-label="${LABELS[value]}" aria-pressed="false">${icon(value)}</button>`
  return `<div class="theme-switch" role="group" aria-label="Theme">${option('light')}${option('auto')}${option('dark')}</div>`
}

// Binds every switch that has not been bound yet, so a renderer can call this
// again after it puts a page (and its own switch) into the DOM.
export function initTheme(root = document) {
  const options = [...root.querySelectorAll('[data-theme-set]')]
    .filter(option => option.dataset.themeBound !== 'true')

  for (const option of options) {
    option.dataset.themeBound = 'true'
    option.addEventListener('click', () => setMode(option.dataset.themeSet))
  }

  if (options.length) paint()
}
