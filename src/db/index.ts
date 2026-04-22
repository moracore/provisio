import Dexie, { type Table } from 'dexie'

export interface Folder {
  id?: number
  parentId: number | null
  name: string
  color: string
  icon: string
  positionIndex: number
  dateAdded: number
}

export interface Item {
  id?: number
  folderId: string | number
  name: string
  description: string
  price: number
  link: string
  imageBlob: Blob | null
  icon: string
  bought: boolean
  positionIndex: number
  dateAdded: number
  updatedAt?: number
}

class ProvisioDB extends Dexie {
  folders!: Table<Folder, number>
  items!: Table<Item, number>

  constructor() {
    super('ProvisioDB')
    this.version(1).stores({
      folders: '++id, parentId, positionIndex',
      items: '++id, folderId, positionIndex',
    })
    this.version(2).stores({
      folders: '++id, parentId, positionIndex',
      items: '++id, folderId, positionIndex',
    })
  }
}

export const db = new ProvisioDB()

// --- CRUD: Folders ---

export async function createFolder(data: Omit<Folder, 'id'>) {
  return db.folders.add(data)
}

export async function updateFolder(id: number, changes: Partial<Folder>) {
  return db.transaction('rw', db.folders, async () => {
    const oldFolder = await db.folders.get(id)
    await db.folders.update(id, changes)

    if (!oldFolder) return

    // If color changed, cascade to all descendant folders
    if (changes.color && changes.color !== oldFolder.color) {
      const allFolders = await db.folders.toArray()
      const descendantIds: number[] = []
      const collect = (parentId: number) => {
        for (const f of allFolders) {
          if (f.parentId === parentId && f.id != null) {
            descendantIds.push(f.id)
            collect(f.id)
          }
        }
      }
      collect(id)
      for (const did of descendantIds) {
        await db.folders.update(did, { color: changes.color })
      }
    }

    // If icon changed, cascade to direct child folders
    if (changes.icon && changes.icon !== oldFolder.icon) {
      const allFolders = await db.folders.toArray()
      const descendantIds: number[] = []
      const collect = (parentId: number) => {
        for (const f of allFolders) {
          if (f.parentId === parentId && f.id != null) {
            descendantIds.push(f.id)
            collect(f.id)
          }
        }
      }
      collect(id)
      for (const did of descendantIds) {
        await db.folders.update(did, { icon: changes.icon })
      }
    }
  })
}

export async function deleteFolder(id: number) {
  return db.transaction('rw', db.folders, db.items, async () => {
    // Reparent subfolders to root
    await db.folders.where('parentId').equals(id).modify({ parentId: null })
    // Move items to uncategorized
    await db.items.where('folderId').equals(id).modify({ folderId: 'uncategorized' })
    // Delete the folder
    await db.folders.delete(id)
  })
}

export async function getFoldersByParent(parentId: number | null) {
  return db.folders.where('parentId').equals(parentId ?? 0).sortBy('positionIndex')
}

export async function getAllFolders() {
  return db.folders.orderBy('positionIndex').toArray()
}

// --- CRUD: Items ---

export async function createItem(data: Omit<Item, 'id'>) {
  return db.items.add(data)
}

export async function updateItem(id: number, changes: Partial<Item>) {
  return db.items.update(id, { ...changes, updatedAt: Date.now() })
}

export async function deleteItem(id: number) {
  return db.items.delete(id)
}

export async function getItemsByFolder(folderId: string | number) {
  return db.items.where('folderId').equals(folderId).sortBy('positionIndex')
}

export async function getAllItems() {
  return db.items.orderBy('positionIndex').toArray()
}

// Recursively sum prices for a folder and all its descendants
export async function getFolderTotal(folderId: number): Promise<number> {
  const allFolders = await db.folders.toArray()
  const allItems = await db.items.toArray()

  const descendantIds = new Set<number>()
  const collect = (id: number) => {
    descendantIds.add(id)
    for (const f of allFolders) {
      if (f.parentId === id && f.id != null) collect(f.id)
    }
  }
  collect(folderId)

  let total = 0
  for (const item of allItems) {
    if (descendantIds.has(item.folderId as number) && !item.bought) {
      total += item.price
    }
  }
  return total
}
