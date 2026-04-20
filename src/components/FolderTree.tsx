import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Home } from 'lucide-react'
import { db, type Folder } from '../db'

interface FolderTreeProps {
  onSelect: (folderId: number | null) => void
  excludeFolderId?: number | null
}

export function FolderTree({ onSelect, excludeFolderId }: FolderTreeProps) {
  const folders = useLiveQuery(() => db.folders.toArray()) ?? []

  const excludedIds = useMemo(() => {
    if (excludeFolderId == null) return new Set<number>()
    const excluded = new Set<number>()
    const collect = (id: number) => {
      excluded.add(id)
      for (const f of folders) {
        if (f.parentId === id && f.id != null) collect(f.id)
      }
    }
    collect(excludeFolderId)
    return excluded
  }, [folders, excludeFolderId])

  const filteredFolders = useMemo(
    () => folders.filter((f) => f.id != null && !excludedIds.has(f.id!)),
    [folders, excludedIds],
  )

  return (
    <div className="folder-tree">
      <button className="tree-node root-node" onClick={() => onSelect(null)}>
        <Home size={16} />
        <span>Root / Home</span>
      </button>
      {filteredFolders
        .filter((f) => f.parentId === null)
        .sort((a, b) => a.positionIndex - b.positionIndex)
        .map((f) => (
          <TreeNode
            key={f.id}
            folder={f}
            allFolders={filteredFolders}
            depth={1}
            onSelect={onSelect}
          />
        ))}
    </div>
  )
}

interface TreeNodeProps {
  folder: Folder
  allFolders: Folder[]
  depth: number
  onSelect: (folderId: number | null) => void
}

function TreeNode({ folder, allFolders, depth, onSelect }: TreeNodeProps) {
  const children = allFolders
    .filter((f) => f.parentId === folder.id)
    .sort((a, b) => a.positionIndex - b.positionIndex)

  return (
    <div>
      <button
        className="tree-node"
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={() => onSelect(folder.id!)}
      >
        <ChevronRight size={14} />
        <span
          className="tree-color-dot"
          style={{ backgroundColor: folder.color }}
        />
        <span>{folder.name}</span>
      </button>
      {children.map((child) => (
        <TreeNode
          key={child.id}
          folder={child}
          allFolders={allFolders}
          depth={depth + 1}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
