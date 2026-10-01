// The home board runtime.
//
// The board ships as static markup — the plain stack on phones, the dealt
// columns on wide screens — and this module owns the layout from there:
//   • wide screens: the bubbles are re-dealt on every visit. A pool with a
//     fixed mix (the board always carries big, medium and small bubbles) is
//     shuffled over the posts and every card's height share jitters around its
//     class, so no two visits look alike and no title ever gets crowded.
//   • phones: the same cards are packed into two columns by height, newest
//     first — a real waterfall, not rows of equal height — with a regular
//     big/small rhythm instead of a roll.
const WIDE = '(min-width: 60rem)'

const SIZES = ['small', 'medium', 'large']
const WEIGHTS = { small: 1.2, medium: 2, large: 3 }

// Six tokens for six cards: two big, two medium, two small. The mix is fixed,
// the deal is not, so the board can never come out flat.
const POOL = ['large', 'large', 'medium', 'medium', 'small', 'small']

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

const atLeast = (size, floor) => (SIZES.indexOf(size) >= SIZES.indexOf(floor) ? size : floor)

function setSize(card, size) {
  card.classList.remove(...SIZES.map(name => `home-card--${name}`))
  card.classList.add(`home-card--${size}`)
}

export function initHomeBoard(root = document) {
  const board = root.querySelector('[data-home-board]')
  if (!board || board.dataset.homeBoardBound === 'true') return
  board.dataset.homeBoardBound = 'true'

  const wide = window.matchMedia(WIDE)

  // --- sideways input ------------------------------------------------------
  const maxScroll = () => board.scrollWidth - board.clientWidth

  // Wheel gestures accumulate freely: snapping is switched off while the wheel
  // is moving and re-armed once it rests, so the board settles on a column
  // instead of being dragged back on every step.
  let snapTimer = null
  const freeScroll = () => {
    board.style.scrollSnapType = 'none'
    clearTimeout(snapTimer)
    snapTimer = setTimeout(() => {
      board.style.scrollSnapType = ''
    }, 160)
  }

  board.addEventListener('wheel', event => {
    if (event.ctrlKey) return // pinch zoom

    const max = maxScroll()
    if (max <= 0) return // stacked layout: nothing to move sideways

    // deltaMode: 0 = pixels, 1 = lines, 2 = pages
    const unit = event.deltaMode === 1 ? 16 : (event.deltaMode === 2 ? board.clientWidth : 1)
    const delta = (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * unit
    const next = Math.min(max, Math.max(0, board.scrollLeft + delta))
    if (next === board.scrollLeft) return // already at that end

    event.preventDefault()
    freeScroll()
    board.scrollLeft = next
  }, { passive: false })

  // Arrow keys walk the board column by column once it has focus.
  board.addEventListener('keydown', event => {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
    if (!forward && !backward || maxScroll() <= 0) return

    const columns = board.querySelectorAll('.home-board__col')
    const first = columns[0]?.getBoundingClientRect()
    const second = columns[1]?.getBoundingClientRect()
    const card = board.querySelector('.home-card')?.getBoundingClientRect()
    const step = second && first && second.width > 0
      ? second.left - first.left
      : (card && card.width > 0 ? card.width : board.clientWidth)

    event.preventDefault()
    board.scrollBy({ left: forward ? step : -step, behavior: 'smooth' })
  })

  // --- layout --------------------------------------------------------------
  const profileColumn = board.querySelector('.home-board__col--profile')
  const postColumns = [...board.querySelectorAll('.home-board__col')].filter(column => column !== profileColumn)

  // What each column holds, so wide screens can always be restored after the
  // phone waterfall rearranged the cards. `data-floor` is the size the build
  // computed from the title: the runtime may deal above it, never below.
  const columnCards = postColumns.map(column => [...column.children])
  const cards = columnCards.flat()
  const floors = cards.map(card => card.dataset.floor || 'small')
  const dealt = cards.map((card, index) => ({ size: floors[index], weight: WEIGHTS[floors[index]] }))

  let rolled = false
  let masonry = null

  // Wide screens: the roll. Dealt once per visit; resizing only re-applies it.
  function deal() {
    const pool = shuffle([...POOL])
    cards.forEach((_, index) => {
      let size = atLeast(pool[index % pool.length], floors[index])
      if (index < 2) size = atLeast(size, 'medium') // the newest two lead
      dealt[index] = { size, weight: WEIGHTS[size] * (0.9 + Math.random() * 0.25) }
    })
  }

  // Phones: one size for every card — an even feed of bubbles whose heights
  // come from the titles alone, packed into the waterfall. No roll here.
  function uniform() {
    cards.forEach((_, index) => {
      dealt[index] = { size: 'medium', weight: WEIGHTS.medium }
    })
  }

  function paint() {
    cards.forEach((card, index) => setSize(card, dealt[index].size))

    let start = 0
    postColumns.forEach((column, columnIndex) => {
      const rows = columnCards[columnIndex]
        .map((_, index) => `minmax(min-content, ${dealt[start + index].weight.toFixed(2)}fr)`)
        .join(' ')
      column.style.setProperty('--rows', rows)
      start += columnCards[columnIndex].length
    })
  }

  // Waterfall packing: every card drops into whichever column is shorter, so
  // the two columns fall together instead of leaving row gaps. Cards are taken
  // from the canonical list, which works whether they currently sit in the
  // build-time columns or in this waterfall.
  function pack() {
    const columns = [...masonry.children]
    for (const column of columns) column.replaceChildren()
    for (const card of cards) {
      const target = columns[0].offsetHeight <= columns[1].offsetHeight ? columns[0] : columns[1]
      target.append(card)
    }
  }

  function buildWaterfall() {
    masonry = document.createElement('div')
    masonry.className = 'home-board__masonry'
    for (let i = 0; i < 2; i++) {
      const column = document.createElement('div')
      column.className = 'home-board__col'
      masonry.append(column)
    }
    board.append(masonry)
    pack()
  }

  function restoreColumns() {
    postColumns.forEach((column, index) => column.replaceChildren(...columnCards[index]))
    masonry?.remove()
    masonry = null
  }

  function layout() {
    if (!board.isConnected) return // a dev re-render replaced the board

    if (wide.matches) {
      if (masonry) restoreColumns()
      if (!rolled) {
        deal()
        rolled = true
      }
      paint()
    } else {
      uniform()
      paint()
      if (masonry) pack()
      else buildWaterfall()
    }
  }

  wide.addEventListener('change', layout)

  let resizeTimer = null
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      if (masonry) pack() // new widths, new balance
    }, 150)
  })

  layout()
}
