import { useState, useEffect, useRef, useCallback } from 'react'
import { icons, Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { IconPicker } from './IconPicker'
import { FolderTree } from './FolderTree'
import {
  createFolder,
  updateFolder,
  createItem,
  updateItem,
  deleteFolder,
  deleteItem,
  type Folder,
  type Item,
} from '../db'

export type EditorTarget =
  | { mode: 'create-folder'; parentId: number | null }
  | { mode: 'edit-folder'; folder: Folder }
  | { mode: 'create-item'; folderId: string | number }
  | { mode: 'edit-item'; item: Item }

interface EditorModalProps {
  target: EditorTarget | null
  onClose: () => void
}

interface FolderDraft {
  name: string
  color: string
  icon: string
}

interface ItemDraft {
  name: string
  description: string
  price: string
  link: string
  icon: string
  imageBlob: Blob | null
}

export function EditorModal({ target, onClose }: EditorModalProps) {
  const [folderDraft, setFolderDraft] = useState<FolderDraft>({ name: '', color: '#ee007b', icon: 'Folder' })
  const [itemDraft, setItemDraft] = useState<ItemDraft>({ name: '', description: '', price: '', link: '', icon: 'Package', imageBlob: null })
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const previewUrlRef = useRef<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setPreviewUrl(null)
  }, [])

  // Reset sub-modals when target changes
  useEffect(() => {
    setMoveOpen(false)
    setConfirmDelete(false)
  }, [target])

  // Initialize draft from target
  useEffect(() => {
    revokePreview()
    if (!target) return
    if (target.mode === 'edit-folder') {
      setFolderDraft({ name: target.folder.name, color: target.folder.color, icon: target.folder.icon })
    } else if (target.mode === 'create-folder') {
      setFolderDraft({ name: '', color: '#ee007b', icon: 'Folder' })
    } else if (target.mode === 'edit-item') {
      setItemDraft({
        name: target.item.name,
        description: target.item.description,
        price: String(target.item.price),
        link: target.item.link,
        icon: target.item.icon,
        imageBlob: target.item.imageBlob,
      })
      if (target.item.imageBlob) {
        const url = URL.createObjectURL(target.item.imageBlob)
        previewUrlRef.current = url
        setPreviewUrl(url)
      }
    } else {
      setItemDraft({ name: '', description: '', price: '', link: '', icon: 'Package', imageBlob: null })
    }
  }, [target, revokePreview])

  // Revoke on unmount
  useEffect(() => () => revokePreview(), [revokePreview])

  if (!target) return null

  const isFolder = target.mode === 'create-folder' || target.mode === 'edit-folder'

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    revokePreview()
    if (file) {
      const url = URL.createObjectURL(file)
      previewUrlRef.current = url
      setPreviewUrl(url)
      setItemDraft((d) => ({ ...d, imageBlob: file }))
    } else {
      setItemDraft((d) => ({ ...d, imageBlob: null }))
    }
  }

  const handleCancel = () => {
    revokePreview()
    onClose()
  }

  const handleSave = async () => {
    if (isFolder) {
      if (target.mode === 'create-folder') {
        await createFolder({
          parentId: target.parentId,
          name: folderDraft.name,
          color: folderDraft.color,
          icon: folderDraft.icon,
          positionIndex: Date.now(),
          dateAdded: Date.now(),
        })
      } else {
        await updateFolder(target.folder.id!, {
          name: folderDraft.name,
          color: folderDraft.color,
          icon: folderDraft.icon,
        })
      }
    } else {
      if (target.mode === 'create-item') {
        await createItem({
          name: itemDraft.name,
          description: itemDraft.description,
          price: parseFloat(itemDraft.price) || 0,
          link: itemDraft.link,
          icon: itemDraft.icon,
          imageBlob: itemDraft.imageBlob,
          bought: false,
          positionIndex: Date.now(),
          dateAdded: Date.now(),
          folderId: target.folderId,
        })
      } else {
        await updateItem(target.item.id!, {
          name: itemDraft.name,
          description: itemDraft.description,
          price: parseFloat(itemDraft.price) || 0,
          link: itemDraft.link,
          icon: itemDraft.icon,
          imageBlob: itemDraft.imageBlob,
        })
      }
    }
    revokePreview()
    onClose()
  }

  const currentIcon = isFolder ? folderDraft.icon : itemDraft.icon
  const IconComponent = (icons[currentIcon as keyof typeof icons] ?? icons['Package']) as LucideIcon

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal editor-modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          {target.mode.startsWith('create') ? 'Create' : 'Edit'}{' '}
          {isFolder ? 'Folder' : 'Item'}
        </h3>

        <div className="editor-form">
          <label>
            Name
            <input
              type="text"
              value={isFolder ? folderDraft.name : itemDraft.name}
              onChange={(e) =>
                isFolder
                  ? setFolderDraft((d) => ({ ...d, name: e.target.value }))
                  : setItemDraft((d) => ({ ...d, name: e.target.value }))
              }
            />
          </label>

          {isFolder && (
            <label>
              Color
              <input
                type="color"
                value={folderDraft.color}
                onChange={(e) => setFolderDraft((d) => ({ ...d, color: e.target.value }))}
              />
            </label>
          )}

          {!isFolder && (
            <>
              <label>
                Description
                <textarea
                  value={itemDraft.description}
                  onChange={(e) => setItemDraft((d) => ({ ...d, description: e.target.value }))}
                />
              </label>
              <label>
                Price
                <input
                  type="number"
                  step="0.01"
                  value={itemDraft.price}
                  onChange={(e) => setItemDraft((d) => ({ ...d, price: e.target.value }))}
                />
              </label>
              <label>
                Link
                <input
                  type="url"
                  value={itemDraft.link}
                  onChange={(e) => setItemDraft((d) => ({ ...d, link: e.target.value }))}
                />
              </label>
              <label>
                Image
                <input type="file" accept="image/*" onChange={handleImageChange} />
              </label>
              {previewUrl && <img src={previewUrl} alt="Preview" className="image-preview" />}
            </>
          )}

          <div className="icon-select">
            <span>Icon:</span>
            <button onClick={() => setIconPickerOpen(true)} className="icon-btn">
              <IconComponent size={20} />
              <span>{currentIcon}</span>
            </button>
          </div>
        </div>

        {/* Actions for existing records */}
        {(target.mode === 'edit-item' || target.mode === 'edit-folder') && (
          <div className="editor-actions">
            {target.mode === 'edit-item' && (
              <button
                className={`btn-bought ${target.item.bought ? 'active' : ''}`}
                onClick={async () => {
                  await updateItem(target.item.id!, { bought: !target.item.bought })
                  onClose()
                }}
              >
                <Check size={16} />
                {target.item.bought ? 'Bought' : 'Mark as bought'}
              </button>
            )}
            <button onClick={() => setMoveOpen(true)}>Move</button>
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={handleCancel}>Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save</button>
        </div>

        {/* Move sub-modal */}
        {moveOpen && (
          <div className="modal-overlay" onClick={() => setMoveOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Move to...</h3>
              <FolderTree
                onSelect={async (destinationId) => {
                  if (target.mode === 'edit-folder') {
                    await updateFolder(target.folder.id!, { parentId: destinationId })
                  } else if (target.mode === 'edit-item') {
                    await updateItem(target.item.id!, { folderId: destinationId ?? 'uncategorized' })
                  }
                  setMoveOpen(false)
                  onClose()
                }}
                excludeFolderId={target.mode === 'edit-folder' ? target.folder.id : undefined}
              />
              <div className="modal-actions">
                <button onClick={() => setMoveOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Delete?</h3>
              <p>This action cannot be undone.</p>
              <div className="modal-actions">
                <button onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button
                  className="btn-danger"
                  onClick={async () => {
                    if (target.mode === 'edit-folder') {
                      await deleteFolder(target.folder.id!)
                    } else if (target.mode === 'edit-item') {
                      await deleteItem(target.item.id!)
                    }
                    setConfirmDelete(false)
                    onClose()
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <IconPicker
          open={iconPickerOpen}
          onClose={() => setIconPickerOpen(false)}
          onSelect={(name) =>
            isFolder
              ? setFolderDraft((d) => ({ ...d, icon: name }))
              : setItemDraft((d) => ({ ...d, icon: name }))
          }
        />
      </div>
    </div>
  )
}
