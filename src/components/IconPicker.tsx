import { useState, useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { icons } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICON_NAMES = Object.keys(icons)
const COLUMNS = 6
const ROW_HEIGHT = 44

interface IconPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (name: string) => void
}

export function IconPicker({ open, onClose, onSelect }: IconPickerProps) {
  const [search, setSearch] = useState('')
  const parentRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(
    () =>
      search
        ? ICON_NAMES.filter((n) => n.toLowerCase().includes(search.toLowerCase()))
        : ICON_NAMES,
    [search],
  )

  const rowCount = Math.ceil(filtered.length / COLUMNS)

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  })

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal icon-picker-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Select Icon</h3>
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div ref={parentRef} className="icon-grid-scroll" style={{ height: 280, overflow: 'auto' }}>
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((vRow) => {
              const startIdx = vRow.index * COLUMNS
              const rowIcons = filtered.slice(startIdx, startIdx + COLUMNS)
              return (
                <div
                  key={vRow.key}
                  className="icon-grid-row"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${vRow.size}px`,
                    transform: `translateY(${vRow.start}px)`,
                    display: 'flex',
                    gap: 4,
                  }}
                >
                  {rowIcons.map((name) => {
                    const Icon = icons[name as keyof typeof icons] as LucideIcon
                    return (
                      <button
                        key={name}
                        className="icon-cell"
                        title={name}
                        onClick={() => {
                          onSelect(name)
                          onClose()
                        }}
                      >
                        <Icon size={20} />
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
