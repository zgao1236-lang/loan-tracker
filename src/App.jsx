import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import TabBar from './components/TabBar'
import Dashboard from './pages/Dashboard'
import Bills from './pages/Bills'
import Charts from './pages/Charts'
import Settings from './pages/Settings'

export default function App() {
  const location = useLocation()
  const showTabBar = !/^\/bills\/.+/.test(location.pathname)

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bills/*" element={<Bills />} />
          <Route path="/charts" element={<Charts />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showTabBar && <TabBar />}
    </div>
  )
}
