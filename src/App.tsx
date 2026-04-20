import { Routes, Route, NavLink } from 'react-router-dom'
import { FolderOpen, List } from 'lucide-react'
import { FolderView } from './components/FolderView'
import { FlatView } from './components/FlatView'

export default function App() {
  return (
    <div className="app">
      <nav className="nav-bar">
        <NavLink to="/" end>
          <FolderOpen size={20} />
          <span>Folders</span>
        </NavLink>
        <NavLink to="/flat">
          <List size={20} />
          <span>All Items</span>
        </NavLink>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<FolderView />} />
          <Route path="/flat" element={<FlatView />} />
        </Routes>
      </main>
    </div>
  )
}
