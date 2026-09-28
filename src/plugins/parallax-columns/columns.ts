/**
 * Geometric column detector for masonry layout (CSS columns or grid)
 * Returns columns and a "element → delta" map, where delta = column.bottom - minBottom
 */

const TOLERANCE = 5 // px - tolerance in clustering by X

export interface Column {
  index: number
  left: number
  bottom: number
  items: HTMLElement[]
}

export interface ColumnLayout {
  columns: Column[]
  minBottom: number
  itemDeltas: Map<HTMLElement, number>
}

export function measureColumns(grid: HTMLElement): ColumnLayout | null {
  const gridRect = grid.getBoundingClientRect()
  const items = Array.from(grid.querySelectorAll<HTMLElement>('.image'))
  if (items.length === 0) return null

  const positioned = items.map((el) => {
    const rect = el.getBoundingClientRect()

    return {
      el,
      left: rect.left - gridRect.left,
      bottom: rect.bottom - gridRect.top
    }
  })

  // Clustering of X‑coordinates
  const clusterLefts: number[] = []
  for (const { left } of positioned) {
    if (!clusterLefts.some((c) => Math.abs(c - left) < TOLERANCE)) {
      clusterLefts.push(left)
    }
  }

  clusterLefts.sort((a, b) => a - b)

  const columns: Column[] = clusterLefts.map((clusterLeft, index) => {
    const colItems = positioned.filter(
      (p) => Math.abs(p.left - clusterLeft) < TOLERANCE
    )

    const bottom = Math.max(
      ...colItems.map((p) => p.bottom)
    )

    return {
      index,
      left: clusterLeft,
      bottom,
      items: colItems.map(
        (p) => p.el
      )
    }
  })

  const minBottom = Math.min(...columns.map((c) => c.bottom))
  const itemDeltas = new Map<HTMLElement, number>()

  for (const col of columns) {
    const delta = col.bottom - minBottom

    for (const item of col.items) {
      itemDeltas.set(item, delta)
    }
  }

  return { columns, minBottom, itemDeltas }
}
