import { useState, useRef, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useVirtualizer } from '@tanstack/react-virtual'
import { SquareCheckBig, icons } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { db } from '../db'
import { EditorModal } from './EditorModal'
import type { EditorTarget } from './EditorModal'

type SortMode = 'newest' | 'recent' | 'oldest' | 'price-asc' | 'price-desc' | 'category'

export function FlatView() {
  const [sort, setSort] = useState<SortMode>('newest')
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null)
  const items = useLiveQuery(() => db.items.toArray()) ?? []
  const folders = useLiveQuery(() => db.folders.toArray()) ?? []
  const parentRef = useRef<HTMLDivElement>(null)

  const folderMap = useMemo(() => {
    const raw = new Map<number, { name: string; color: string; icon: string; parentId: number | null }>()
    for (const f of folders) {
      if (f.id != null) raw.set(f.id, { name: f.name, color: f.color, icon: f.icon, parentId: f.parentId })
    }

    const getRootFolder = (id: number | null): { name: string; color: string; icon: string } | null => {
      if (id == null) return null
      let current = raw.get(id)
      if (!current) return null
      while (current.parentId != null && raw.has(current.parentId)) {
        current = raw.get(current.parentId)!
      }
      return { name: current.name, color: current.color, icon: current.icon }
    }

    const map = new Map<string | number, { name: string; color: string; icon: string }>()
    map.set('uncategorized', { name: 'Uncategorized', color: '#8888a0', icon: 'Folder' })
    for (const f of folders) {
      if (f.id != null) {
        const root = getRootFolder(f.id)
        if (root) map.set(f.id, root)
      }
    }
    return map
  }, [folders])

  const sorted = useMemo(() => {
    const arr = [...items]
    switch (sort) {
      case 'newest': return arr.sort((a, b) => b.dateAdded - a.dateAdded)
      case 'recent': return arr.sort((a, b) => (b.updatedAt ?? b.dateAdded) - (a.updatedAt ?? a.dateAdded))
      case 'oldest': return arr.sort((a, b) => a.dateAdded - b.dateAdded)
      case 'price-asc': return arr.sort((a, b) => a.price - b.price)
      case 'price-desc': return arr.sort((a, b) => b.price - a.price)
      case 'category': return arr.sort((a, b) =>
        (folderMap.get(a.folderId)?.name ?? '').localeCompare(folderMap.get(b.folderId)?.name ?? ''))
    }
  }, [items, sort, folderMap])

  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    gap: 8,
    overscan: 10,
  })

  return (
    <div className="flat-view">
      <div className="view-header">
        <h2>All Items</h2>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
          <option value="newest">Newest</option>
          <option value="recent">Recent</option>
          <option value="oldest">Oldest</option>
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
                  {(() => {
                    const folder = folderMap.get(item.folderId)
                    if (!folder) return null
                    const FolderIcon = (icons[folder.icon as keyof typeof icons] ?? icons['Folder']) as LucideIcon
                    return (
                      <span className="flat-item-folder" style={{ color: folder.color }}>
                        <FolderIcon size={12} />
                        {folder.name}
                      </span>
                    )
                  })()}
                </div>
                <div className="flat-item-right">
                  {item.bought && <SquareCheckBig size={16} color="#22c55e" />}
                  <div className="flat-item-price-date">
                    {item.price > 0 && <span className="item-price">£{item.price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                    <span className="flat-item-date">{new Date(item.dateAdded).toLocaleDateString('en-GB')}</span>
                  </div>
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
