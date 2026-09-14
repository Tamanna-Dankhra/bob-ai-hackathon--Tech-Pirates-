import { useState } from 'react'
import Dashboard from './components/Dashboard.jsx'
import SafetyModule from './components/SafetyModule.jsx'
import RegulatoryModule from './components/RegulatoryModule.jsx'
import CopilotModule from './components/CopilotModule.jsx'
import {
  LayoutDashboard,
  ShieldAlert,
  FileCheck2,
  MessageSquareText,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',              icon: LayoutDashboard },
  { id: 'safety',      label: 'Safety Intelligence',    icon: ShieldAlert },
  { id: 'regulatory',  label: 'Regulatory Intelligence', icon: FileCheck2 },
  { id: 'copilot',     label: 'AI Copilot',             icon: MessageSquareText },
]

const PAGE_TITLES = {
  dashboard:  { title: 'Dashboard',               sub: 'Overview of safety signals and regulatory readiness' },
  safety:     { title: 'Safety Intelligence',     sub: 'Upload adverse-event data to identify potential safety signals' },
  regulatory: { title: 'Regulatory Intelligence', sub: 'Check your submission structure against ICH M4 CTD requirements' },
  copilot:    { title: 'AI Copilot',              sub: 'Ask questions about your safety signals and regulatory readiness' },
}

export default function App() {
  // ── Active page ──
  const [page, setPage] = useState('dashboard')

  // ── Shared analysis state ──
  const [safetyResults, setSafetyResults] = useState(null)
  const [regulatoryResults, setRegulatoryResults] = useState(null)
  const [selectedSignal, setSelectedSignal] = useState(null)

  const { title, sub } = PAGE_TITLES[page]

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-badge">
            <div className="sidebar-logo-icon">🛡️</div>
            <div className="sidebar-logo-text">
              <div className="sidebar-logo-name">PharmaGuard AI</div>
              <div className="sidebar-logo-tagline">Drug Safety & Regulatory</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item${page === id ? ' active' : ''}`}
              onClick={() => setPage(id)}
            >
              <Icon className="nav-icon" />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          IBM Bob AI Hackathon · Problem Statement P2
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">{title}</div>
            <div className="topbar-sub">{sub}</div>
          </div>
          <div className="topbar-status">
            <span className="status-dot" />
            Backend Connected
          </div>
        </header>

        <main className="page-body">
          {page === 'dashboard' && (
            <Dashboard
              safetyResults={safetyResults}
              regulatoryResults={regulatoryResults}
              selectedSignal={selectedSignal}
              onNavigate={setPage}
            />
          )}
          {page === 'safety' && (
            <SafetyModule
              safetyResults={safetyResults}
              onResults={setSafetyResults}
              onSelectSignal={setSelectedSignal}
              onNavigate={setPage}
            />
          )}
          {page === 'regulatory' && (
            <RegulatoryModule
              regulatoryResults={regulatoryResults}
              onResults={setRegulatoryResults}
            />
          )}
          {page === 'copilot' && (
            <CopilotModule
              safetyResults={safetyResults}
              regulatoryResults={regulatoryResults}
              selectedSignal={selectedSignal}
            />
          )}
        </main>
      </div>
    </div>
  )
}
