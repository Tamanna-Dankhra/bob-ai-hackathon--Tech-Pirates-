import { useState, useMemo } from 'react'
import { FileCheck2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { checkRegulatory } from '../api/client.js'

// ─── Static CTD requirement definitions ────────────────────────────────────
// These mirror backend/data/ctd_requirements.json exactly.
const CTD_REQUIREMENTS = [
  { module: '1', section: '1.0',    title: 'Comprehensive Table of Contents',              priority: 'HIGH' },
  { module: '1', section: '1.1',    title: 'Application Form (Regional)',                 priority: 'HIGH' },
  { module: '1', section: '1.2',    title: 'Labeling (SmPC / Package Leaflet)',           priority: 'HIGH' },
  { module: '1', section: '1.3',    title: 'Product Information',                         priority: 'MEDIUM' },
  { module: '1', section: '1.4',    title: 'Information About the Experts',               priority: 'LOW' },
  { module: '2', section: '2.1',    title: 'Table of Contents for Module 2',              priority: 'MEDIUM' },
  { module: '2', section: '2.2',    title: 'Introduction to the Summary Documents',       priority: 'MEDIUM' },
  { module: '2', section: '2.3',    title: 'Quality Overall Summary (QOS)',               priority: 'HIGH' },
  { module: '2', section: '2.4',    title: 'Nonclinical Overview',                        priority: 'HIGH' },
  { module: '2', section: '2.5',    title: 'Clinical Overview',                           priority: 'HIGH' },
  { module: '2', section: '2.6',    title: 'Nonclinical Written and Tabulated Summaries', priority: 'HIGH' },
  { module: '2', section: '2.7',    title: 'Clinical Summary',                            priority: 'HIGH' },
  { module: '3', section: '3.1',    title: 'Module 3 Table of Contents',                  priority: 'LOW' },
  { module: '3', section: '3.2.S.1', title: 'Drug Substance - General Information',       priority: 'HIGH' },
  { module: '3', section: '3.2.S.2', title: 'Drug Substance - Manufacture',               priority: 'HIGH' },
  { module: '3', section: '3.2.S.3', title: 'Drug Substance - Characterisation',          priority: 'HIGH' },
  { module: '3', section: '3.2.S.4', title: 'Drug Substance - Control of Drug Substance', priority: 'HIGH' },
  { module: '3', section: '3.2.S.5', title: 'Drug Substance - Reference Standards',       priority: 'MEDIUM' },
  { module: '3', section: '3.2.S.6', title: 'Drug Substance - Container Closure System',  priority: 'MEDIUM' },
  { module: '3', section: '3.2.S.7', title: 'Drug Substance - Stability',                 priority: 'HIGH' },
  { module: '3', section: '3.2.P.1', title: 'Drug Product - Description and Composition', priority: 'HIGH' },
  { module: '3', section: '3.2.P.2', title: 'Drug Product - Pharmaceutical Development',  priority: 'HIGH' },
  { module: '3', section: '3.2.P.3', title: 'Drug Product - Manufacture',                 priority: 'HIGH' },
  { module: '3', section: '3.2.P.4', title: 'Drug Product - Control of Excipients',       priority: 'MEDIUM' },
  { module: '3', section: '3.2.P.5', title: 'Drug Product - Control of Drug Product',     priority: 'HIGH' },
  { module: '3', section: '3.2.P.6', title: 'Drug Product - Reference Standards',         priority: 'MEDIUM' },
  { module: '3', section: '3.2.P.7', title: 'Drug Product - Container Closure System',    priority: 'MEDIUM' },
  { module: '3', section: '3.2.P.8', title: 'Drug Product - Stability',                   priority: 'HIGH' },
  { module: '4', section: '4.1',    title: 'Module 4 Table of Contents',                  priority: 'LOW' },
  { module: '4', section: '4.2.1',  title: 'Pharmacology - Primary Pharmacodynamics',     priority: 'HIGH' },
  { module: '4', section: '4.2.2',  title: 'Pharmacology - Secondary Pharmacodynamics',   priority: 'MEDIUM' },
  { module: '4', section: '4.2.3',  title: 'Pharmacology - Safety Pharmacology',          priority: 'HIGH' },
  { module: '4', section: '4.2.4',  title: 'Pharmacokinetics',                            priority: 'HIGH' },
  { module: '4', section: '4.2.5',  title: 'Toxicology - Single Dose',                    priority: 'HIGH' },
  { module: '4', section: '4.2.6',  title: 'Toxicology - Repeat Dose',                    priority: 'HIGH' },
  { module: '4', section: '4.2.7',  title: 'Toxicology - Genotoxicity',                   priority: 'HIGH' },
  { module: '5', section: '5.1',    title: 'Module 5 Table of Contents',                  priority: 'LOW' },
  { module: '5', section: '5.2',    title: 'Tabular Listing of All Clinical Studies',     priority: 'HIGH' },
  { module: '5', section: '5.3.1',  title: 'Reports of Biopharmaceutic Studies',          priority: 'HIGH' },
  { module: '5', section: '5.3.3',  title: 'Reports of Human PK Studies',                 priority: 'HIGH' },
  { module: '5', section: '5.3.4',  title: 'Reports of Human PD Studies',                 priority: 'HIGH' },
  { module: '5', section: '5.3.5',  title: 'Reports of Efficacy and Safety Studies',      priority: 'HIGH' },
  { module: '5', section: '5.3.6',  title: 'Reports of Post-marketing Experience',        priority: 'MEDIUM' },
  { module: '5', section: '5.4',    title: 'Literature References',                       priority: 'MEDIUM' },
]

const MODULES = ['1', '2', '3', '4', '5']
const MODULE_NAMES = {
  '1': 'Module 1 — Regional Administrative Information',
  '2': 'Module 2 — Common Technical Document Summaries',
  '3': 'Module 3 — Quality',
  '4': 'Module 4 — Nonclinical Study Reports',
  '5': 'Module 5 — Clinical Study Reports',
}

function PriorityBadge({ priority }) {
  const cls = priority === 'HIGH' ? 'badge-high' : priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'
  return <span className={`badge ${cls}`}>{priority}</span>
}

function StatusBadge({ status }) {
  const cls = status === 'COMPLETE' ? 'badge-complete' : status === 'INCOMPLETE' ? 'badge-incomplete' : 'badge-missing'
  return <span className={`badge ${cls}`}>{status}</span>
}

export default function RegulatoryModule({ regulatoryResults, onResults }) {
  // Map section → status ('complete' | 'incomplete' | 'missing')
  const [sectionStatus, setSectionStatus] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedModules, setExpandedModules] = useState({ '1': true, '2': true, '3': true, '4': true, '5': true })

  const setStatus = (section, status) => {
    setSectionStatus(prev => ({ ...prev, [section]: status }))
  }

  const submitted = useMemo(() =>
    Object.entries(sectionStatus).filter(([, v]) => v === 'complete').map(([k]) => k),
    [sectionStatus]
  )
  const incomplete = useMemo(() =>
    Object.entries(sectionStatus).filter(([, v]) => v === 'incomplete').map(([k]) => k),
    [sectionStatus]
  )

  const handleCheck = async () => {
    setLoading(true); setError(null)
    try {
      const result = await checkRegulatory({
        submitted_sections: submitted,
        incomplete_sections: incomplete,
      })
      onResults(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = m => setExpandedModules(prev => ({ ...prev, [m]: !prev[m] }))

  const readiness = regulatoryResults?.readiness_percentage ?? null

  return (
    <div>
      {/* ── Checklist card ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">ICH M4 CTD Checklist</div>
            <div className="card-subtitle">Mark sections as Complete or Incomplete. Unmarked sections are treated as Missing.</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleCheck}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" /> Checking…</>
            ) : (
              <><FileCheck2 size={16} /> Check Submission Readiness</>
            )}
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ margin: '0 24px 16px' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <div className="card-body">
          {MODULES.map(mod => {
            const reqs = CTD_REQUIREMENTS.filter(r => r.module === mod)
            const expanded = expandedModules[mod]
            const completedCount = reqs.filter(r => sectionStatus[r.section] === 'complete').length
            return (
              <div className="ctd-module-group" key={mod}>
                <div className="ctd-module-header" onClick={() => toggleModule(mod)}>
                  <span>{MODULE_NAMES[mod]}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
                      {completedCount}/{reqs.length} complete
                    </span>
                    {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </div>
                {expanded && reqs.map(req => (
                  <div className="ctd-row" key={req.section}>
                    <span className="ctd-section-id">{req.section}</span>
                    <span className="ctd-title">{req.title}</span>
                    <PriorityBadge priority={req.priority} />
                    <select
                      className="ctd-status-select"
                      value={sectionStatus[req.section] || 'missing'}
                      onChange={e => setStatus(req.section, e.target.value)}
                      style={{
                        color: sectionStatus[req.section] === 'complete' ? '#16a34a'
                          : sectionStatus[req.section] === 'incomplete' ? '#d97706'
                          : '#dc2626'
                      }}
                    >
                      <option value="missing">✗ Missing</option>
                      <option value="incomplete">◑ Incomplete</option>
                      <option value="complete">✓ Complete</option>
                    </select>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Results ── */}
      {regulatoryResults && (
        <>
          {/* Readiness summary */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">Submission Readiness</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 20 }}>
                <div className="readiness-ring">
                  <div
                    className="readiness-pct"
                    style={{ color: readiness >= 70 ? '#059669' : readiness >= 40 ? '#d97706' : '#dc2626' }}
                  >
                    {readiness}%
                  </div>
                  <div className="readiness-label">Readiness Score</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="progress-bar-track" style={{ marginBottom: 14 }}>
                    <div
                      className={`progress-bar-fill ${readiness >= 70 ? 'green' : readiness >= 40 ? 'amber' : 'red'}`}
                      style={{ width: `${readiness}%` }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[
                      { label: 'Complete',   value: regulatoryResults.complete_count,   color: '#059669' },
                      { label: 'Incomplete', value: regulatoryResults.incomplete_count, color: '#d97706' },
                      { label: 'Missing',    value: regulatoryResults.missing_count,    color: '#dc2626' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8, padding: '12px 8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
                        <div style={{ fontSize: 12, color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prioritized gaps */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Prioritized Gap Report</div>
              <div className="card-subtitle">{regulatoryResults.prioritized_gaps.length} gaps identified · sorted HIGH → MEDIUM → LOW</div>
            </div>
            <div className="card-body">
              {regulatoryResults.prioritized_gaps.length === 0 ? (
                <div className="alert alert-success">
                  🎉 Excellent! No gaps found — your submission appears complete.
                </div>
              ) : (
                regulatoryResults.prioritized_gaps.map((g, i) => (
                  <div key={i} className={`gap-card ${g.priority.toLowerCase()}`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 90 }}>
                      <PriorityBadge priority={g.priority} />
                      <StatusBadge status={g.status} />
                    </div>
                    <div className="gap-card-body">
                      <div className="gap-card-title">Section {g.section} — {g.title}</div>
                      <div className="gap-card-meta">Module {g.module}</div>
                      <div className="gap-card-action">→ {g.action}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {!regulatoryResults && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No submission check yet</div>
            <div className="empty-state-text">Mark sections in the checklist above and click "Check Submission Readiness".</div>
          </div>
        </div>
      )}
    </div>
  )
}
