import { create } from 'zustand'

interface MoveTarget {
  type: 'folder' | 'item'
  id: number
}

interface DeleteTarget {
  type: 'folder' | 'item'
  id: number
  name: string
}

interface ModalState {
  // Move modal
  moveTarget: MoveTarget | null
  openMoveModal: (target: MoveTarget) => void
  closeMoveModal: () => void

  // Delete confirmation
  deleteTarget: DeleteTarget | null
  openDeleteModal: (target: DeleteTarget) => void
  closeDeleteModal: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  moveTarget: null,
  openMoveModal: (target) => set({ moveTarget: target }),
  closeMoveModal: () => set({ moveTarget: null }),

  deleteTarget: null,
  openDeleteModal: (target) => set({ deleteTarget: target }),
  closeDeleteModal: () => set({ deleteTarget: null }),
}))
