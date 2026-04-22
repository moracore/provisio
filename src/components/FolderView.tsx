import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { icons, SquareCheckBig, ArrowUpFromDot, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { db, type Folder, type Item, getFolderTotal } from '../db'
import { EditorModal } from './EditorModal'
import type { EditorTarget } from './EditorModal'

export function FolderView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentFolderId = searchParams.get('folder')
    ? Number(searchParams.get('folder'))
    : null

  const folders = useLiveQuery(
    () => db.folders.where('parentId').equals(currentFolderId ?? 0).sortBy('positionIndex'),
    [currentFolderId],
  ) ?? []

  const rootFolders = useLiveQuery(
    () => currentFolderId === null
      ? db.folders.filter((f) => f.parentId === null).sortBy('positionIndex')
      : Promise.resolve([] as Folder[]),
    [currentFolderId],
  ) ?? []

  const currentFolder = useLiveQuery(
    () => currentFolderId != null ? db.folders.get(currentFolderId) : undefined,
    [currentFolderId],
  )

  const displayFolders = currentFolderId === null ? rootFolders : folders

  const folderId = currentFolderId ?? 'uncategorized'
  const items = useLiveQuery(
    () => db.items.where('folderId').equals(folderId).sortBy('positionIndex'),
    [folderId],
  ) ?? []

  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null)

  return (
    <div className="folder-view">
      <div className="view-header">
        <h2>{currentFolder?.name ?? 'Home'}</h2>
        <div className="view-actions">
          {currentFolderId != null && (
            <button
              className="back-btn"
              onClick={() => {
                if (currentFolder?.parentId != null) {
                  setSearchParams({ folder: String(currentFolder.parentId) })
                } else {
                  setSearchParams({})
                }
              }}
            >
              <ArrowUpFromDot size={16} />
            </button>
          )}
          <button onClick={() => setEditorTarget({ mode: 'create-folder', parentId: currentFolderId })}>+ Folder</button>
          <button onClick={() => setEditorTarget({ mode: 'create-item', folderId })}>+ Item</button>
        </div>
      </div>

      <div className="card-grid">
        {displayFolders.map((folder) => (
          <FolderCard
            key={`f-${folder.id}`}
            folder={folder}
            onOpen={() => setSearchParams({ folder: String(folder.id) })}
            onEdit={() => setEditorTarget({ mode: 'edit-folder', folder })}
          />
        ))}
        {items.map((item) => (
          <ItemCard
            key={`i-${item.id}`}
            item={item}
            onEdit={() => setEditorTarget({ mode: 'edit-item', item })}
          />
        ))}
      </div>

      <EditorModal target={editorTarget} onClose={() => setEditorTarget(null)} />
    </div>
  )
}

function FolderCard({ folder, onOpen, onEdit }: {
  folder: Folder
  onOpen: () => void
  onEdit: () => void
}) {
  const Icon = (icons[folder.icon as keyof typeof icons] ?? icons['Folder']) as LucideIcon
  const total = useLiveQuery(() => getFolderTotal(folder.id!), [folder.id])

  return (
    <div className="card folder-card" onClick={onOpen}>
      <Icon size={40} color={folder.color} />
      <span className="card-name">{folder.name}</span>
      {total != null && total > 0 && <span className="folder-total">£{total.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
      <button className="card-edit-btn" onClick={(e) => { e.stopPropagation(); onEdit() }}>
        <Settings size={16} />
      </button>
    </div>
  )
}

function ItemCard({ item, onEdit }: {
  item: Item
  onEdit: () => void
}) {
  const [imgUrl] = useState(() => item.imageBlob ? URL.createObjectURL(item.imageBlob) : null)
  const Icon = (icons[item.icon as keyof typeof icons] ?? icons['Package']) as LucideIcon

  return (
    <div className={`card item-card ${item.bought ? 'item-bought' : ''}`} onClick={onEdit}>
      <div className="item-card-image">
        {imgUrl ? (
          <img src={imgUrl} alt={item.name} />
        ) : (
          <Icon size={48} />
        )}
      </div>
      <div className="item-card-body">
        <span className="card-name">{item.name}</span>
        {item.price > 0 && <span className="item-price">£{item.price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
      </div>
      {item.bought && (
        <span className="bought-indicator">
          <SquareCheckBig size={18} />
        </span>
      )}
    </div>
  )
}
