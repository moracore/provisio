import { useState, useRef, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useVirtualizer } from '@tanstack/react-virtual'
import { SquareCheckBig } from 'lucide-react'
import { db } from '../db'
import { EditorModal } from './EditorModal'
import type { EditorTarget } from './EditorModal'

type SortMode = 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc' | 'category'

export function FlatView() {
  const [sort, setSort] = useState<SortMode>('date-desc')
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null)
  const items = useLiveQuery(() => db.items.toArray()) ?? []
  const folders = useLiveQuery(() => db.folders.toArray()) ?? []
  const parentRef = useRef<HTMLDivElement>(null)

  const folderNameMap = useMemo(() => {
    const map = new Map<string | number, string>()
    map.set('uncategorized', 'Uncategorized')
    for (const f of folders) {
      if (f.id != null) map.set(f.id, f.name)
    }
    return map
  }, [folders])

  const sorted = useMemo(() => {
    const arr = [...items]
    switch (sort) {
      case 'date-asc': return arr.sort((a, b) => a.dateAdded - b.dateAdded)
      case 'date-desc': return arr.sort((a, b) => b.dateAdded - a.dateAdded)
      case 'price-asc': return arr.sort((a, b) => a.price - b.price)
      case 'price-desc': return arr.sort((a, b) => b.price - a.price)
      case 'category': return arr.sort((a, b) =>
        (folderNameMap.get(a.folderId) ?? '').localeCompare(folderNameMap.get(b.folderId) ?? ''))
    }
  }, [items, sort, folderNameMap])

  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  })

  return (
    <div className="flat-view">
      <div className="view-header">
        <h2>All Items</h2>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
          <option value="date-desc">Newest</option>
          <option value="date-asc">Oldest</option>
          <option value="price-desc">Price ↓</option>
          <option value="price-asc">Price ↑</option>
          <option value="category">Category</option>
        </select>
      </div>
      <div ref={parentRef} className="flat-scroll">
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((vRow) => {
            const item = sorted[vRow.index]
            return (
              <div
                key={vRow.key}
                className="flat-list-item"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${vRow.size}px`,
                  transform: `translateY(${vRow.start}px)`,
                }}
                onClick={() => setEditorTarget({ mode: 'edit-item', item })}
              >
                <div className="flat-item-info">
                  <span className="flat-item-name">{item.name}</span>
                  <span className="flat-item-folder">{folderNameMap.get(item.folderId) ?? ''}</span>
                </div>
                <div className="flat-item-right">
                  <span className="flat-item-date">{new Date(item.dateAdded).toLocaleDateString('en-GB')}</span>
                  {item.price > 0 && <span className="item-price">£{item.price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                  {item.bought && <SquareCheckBig size={16} color="#22c55e" />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <EditorModal target={editorTarget} onClose={() => setEditorTarget(null)} />
    </div>
  )
}
