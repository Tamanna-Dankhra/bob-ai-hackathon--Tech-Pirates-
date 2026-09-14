import { ShieldAlert, FileCheck2, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react'

function MetricCard({ label, value, sub, colorClass = 'blue', icon: Icon }) {
  return (
    <div className={`metric-card ${colorClass}`}>
      {Icon && <Icon className="metric-icon" />}
      <div className="metric-label">{label}</div>
      <div className={`metric-value${colorClass === 'red' ? ' text-red' : colorClass === 'green' ? ' text-green' : colorClass === 'amber' ? ' text-amber' : ''}`}>
        {value}
      </div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
}

function PriorityBadge({ priority }) {
  const cls = priority === 'HIGH' ? 'badge-high' : priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'
  return <span className={`badge ${cls}`}>{priority}</span>
}

export default function Dashboard({ safetyResults, regulatoryResults, selectedSignal, onNavigate }) {
  const signals = safetyResults?.signals ?? []
  const highSignals = signals.filter(s => s.priority === 'HIGH')
  const readiness = regulatoryResults?.readiness_percentage ?? null
  const criticalGaps = regulatoryResults?.prioritized_gaps?.filter(g => g.priority === 'HIGH' && g.status === 'MISSING') ?? []

  // Build combined priority actions
  const priorityActions = []
  highSignals.slice(0, 3).forEach(s => {
    priorityActions.push({
      type: 'safety',
      priority: 'HIGH',
      title: `${s.drug} — ${s.adverse_event}`,
      detail: `PRR: ${s.prr}`,
      meta: 'Potential safety signal requiring investigation',
    })
  })
  criticalGaps.slice(0, 3).forEach(g => {
    priorityActions.push({
      type: 'regulatory',
      priority: 'HIGH',
      title: `Module ${g.module} — Missing requirement`,
      detail: `Section ${g.section}: ${g.title}`,
      meta: 'Complete the missing CTD section',
    })
  })
  if (signals.filter(s => s.priority === 'MEDIUM').length > 0 && priorityActions.length < 5) {
    const med = signals.find(s => s.priority === 'MEDIUM')
    if (med) {
      priorityActions.push({
        type: 'safety',
        priority: 'MEDIUM',
        title: `${med.drug} — ${med.adverse_event}`,
        detail: `PRR: ${med.prr}`,
        meta: 'Medium-priority signal for review',
      })
    }
  }

  const recentSignals = signals.slice(0, 5)

  return (
    <div>
      {/* ── Metric cards ── */}
      <div className="metric-grid">
        <MetricCard
          label="Potential Safety Signals"
          value={safetyResults ? signals.length : '—'}
          sub={safetyResults ? `from ${safetyResults.summary.num_drugs} drugs` : 'No analysis yet'}
          colorClass="blue"
          icon={ShieldAlert}
        />
        <MetricCard
          label="High Priority Signals"
          value={safetyResults ? highSignals.length : '—'}
          sub={safetyResults ? 'Require immediate review' : 'No analysis yet'}
          colorClass="red"
          icon={AlertTriangle}
        />
        <MetricCard
          label="Submission Readiness"
          value={readiness !== null ? `${readiness}%` : '—'}
          sub={readiness !== null ? `${regulatoryResults.complete_count} of ${regulatoryResults.total_requirements} sections` : 'No check yet'}
          colorClass="green"
          icon={FileCheck2}
        />
        <MetricCard
          label="Critical Regulatory Gaps"
          value={regulatoryResults ? criticalGaps.length : '—'}
          sub={regulatoryResults ? 'HIGH priority missing' : 'No check yet'}
          colorClass="amber"
          icon={TrendingUp}
        />
      </div>

      {/* ── Two-column row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Priority Action Center */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Priority Action Center</div>
              <div className="card-subtitle">Combined highest-priority items</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: '8px 24px' }}>
            {priorityActions.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No actions yet</div>
                <div className="empty-state-text">Run safety analysis and regulatory check to see priority actions here.</div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => onNavigate('safety')}>
                    <ShieldAlert size={14} /> Safety Analysis
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('regulatory')}>
                    <FileCheck2 size={14} /> Regulatory Check
                  </button>
                </div>
              </div>
            ) : (
              priorityActions.map((a, i) => (
                <div className="action-item" key={i}>
                  <div className={`action-priority-bar ${a.priority.toLowerCase()}`} />
                  <div className="action-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <PriorityBadge priority={a.priority} />
                      <span style={{ fontSize: 11, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {a.type === 'safety' ? 'Safety' : 'Regulatory'}
                      </span>
                    </div>
                    <div className="action-title">{a.title}</div>
                    <div className="action-detail">{a.detail}</div>
                    <div className="action-meta">{a.meta}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Safety Signals */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Safety Signals</div>
              <div className="card-subtitle">Latest potential signals detected</div>
            </div>
            {safetyResults && (
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('safety')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                View all <ArrowRight size={13} />
              </button>
            )}
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentSignals.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">No safety analysis yet</div>
                <div className="empty-state-text">Upload a CSV in Safety Intelligence to detect signals.</div>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => onNavigate('safety')}>
                  <ShieldAlert size={14} /> Start Analysis
                </button>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Drug</th>
                    <th>Adverse Event</th>
                    <th>PRR</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSignals.map((s, i) => (
                    <tr key={i} className={`row-${s.priority.toLowerCase()}`}>
                      <td style={{ fontWeight: 600 }}>{s.drug}</td>
                      <td>{s.adverse_event}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.prr}</td>
                      <td><PriorityBadge priority={s.priority} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Readiness bar if available */}
      {regulatoryResults && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Submission Readiness Overview</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div className="readiness-ring" style={{ minWidth: 100 }}>
                <div className={`readiness-pct ${readiness >= 70 ? 'text-green' : readiness >= 40 ? 'text-amber' : 'text-red'}`}
                  style={{ color: readiness >= 70 ? '#059669' : readiness >= 40 ? '#d97706' : '#dc2626' }}>
                  {readiness}%
                </div>
                <div className="readiness-label">Readiness</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="progress-bar-track" style={{ marginBottom: 12 }}>
                  <div className={`progress-bar-fill ${readiness >= 70 ? 'green' : readiness >= 40 ? 'amber' : 'red'}`}
                    style={{ width: `${readiness}%` }} />
                </div>
                <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                  <span style={{ color: '#16a34a' }}>✓ Complete: <strong>{regulatoryResults.complete_count}</strong></span>
                  <span style={{ color: '#d97706' }}>◑ Incomplete: <strong>{regulatoryResults.incomplete_count}</strong></span>
                  <span style={{ color: '#dc2626' }}>✗ Missing: <strong>{regulatoryResults.missing_count}</strong></span>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('regulatory')}>
                View Details <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
