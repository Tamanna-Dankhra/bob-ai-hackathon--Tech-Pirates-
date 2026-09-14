import React, { useState, useCallback } from 'react'
import { UploadCloud, AlertCircle, BarChart2, Search, FlaskConical } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { analyzeSafety, loadDemoData } from '../api/client.js'

function PriorityBadge({ priority }) {
  const cls = priority === 'HIGH' ? 'badge-high' : priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'
  return <span className={`badge ${cls}`}>{priority}</span>
}

const PRIORITY_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' }

export default function SafetyModule({ safetyResults, onResults, onSelectSignal, onNavigate }) {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)

  // ── Drag & drop handlers ──
  const onDragOver = useCallback(e => { e.preventDefault(); setDragging(true) }, [])
  const onDragLeave = useCallback(() => setDragging(false), [])
  const onDrop = useCallback(e => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); setError(null) }
  }, [])
  const onFileChange = e => {
    if (e.target.files[0]) { setFile(e.target.files[0]); setError(null) }
  }

  // ── Analyze uploaded CSV ──
  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true); setError(null)
    try {
      const result = await analyzeSafety(file)
      onResults(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Load demo dataset from backend ──
  const handleLoadDemo = async () => {
    setDemoLoading(true); setError(null)
    try {
      const result = await loadDemoData()
      onResults(result)
      setFile(null) // clear any previously selected file
    } catch (err) {
      setError(err.message)
    } finally {
      setDemoLoading(false)
    }
  }

  const signals = safetyResults?.signals ?? []
  const chartData = signals.slice(0, 10).map(s => ({
    name: `${s.drug.replace('Drug', '')} / ${s.adverse_event.length > 14 ? s.adverse_event.slice(0, 14) + '…' : s.adverse_event}`,
    prr: s.prr,
    priority: s.priority,
  }))

  const anyLoading = loading || demoLoading

  return (
    <div>
      {/* ── Upload card ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Adverse Event Data Upload</div>
            <div className="card-subtitle">CSV format: drug_name, adverse_event, report_count</div>
          </div>
          {/* Demo button — top-right of card header */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleLoadDemo}
            disabled={anyLoading}
            title="Load the built-in synthetic demo dataset and run analysis"
          >
            {demoLoading ? (
              <><span className="spinner spinner-dark" /> Loading demo…</>
            ) : (
              <><FlaskConical size={14} /> Load Demo Data</>
            )}
          </button>
        </div>
        <div className="card-body">
          {/* Drop zone */}
          <div
            className={`upload-zone${dragging ? ' drag-over' : ''}${file ? ' has-file' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById('csv-input').click()}
          >
            <input
              id="csv-input"
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />
            {file ? (
              <>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
                <div className="upload-text" style={{ color: '#065f46' }}>File ready</div>
                <div className="upload-file-name">{file.name}</div>
                <div className="upload-hint" style={{ marginTop: 6 }}>Click to choose a different file</div>
              </>
            ) : (
              <>
                <UploadCloud className="upload-icon" size={40} />
                <div className="upload-text">Drag & drop your CSV here, or click to browse</div>
                <div className="upload-hint">Accepts .csv files · Required columns: drug_name, adverse_event, report_count</div>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ marginTop: 14 }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Analyze button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={!file || anyLoading}
            >
              {loading ? (
                <><span className="spinner" /> Analyzing…</>
              ) : (
                <><BarChart2 size={16} /> Analyze Safety Data</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      {safetyResults && (
        <>
          {/* Demo data notice */}
          {safetyResults.demo && (
            <div className="alert alert-info" style={{ marginBottom: 16, fontSize: 12.5 }}>
              <FlaskConical size={15} />
              <span><strong>Demo dataset:</strong> {safetyResults.demo_note}</span>
            </div>
          )}

          {/* Summary stats */}
          <div className="stat-row" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total Reports', value: safetyResults.summary.total_reports },
              { label: 'Drugs Analyzed', value: safetyResults.summary.num_drugs },
              { label: 'Adverse Events', value: safetyResults.summary.num_adverse_events },
              { label: 'Potential Signals', value: safetyResults.summary.num_potential_signals },
            ].map(({ label, value }) => (
              <div className="stat-box" key={label}>
                <div className="stat-box-value">{value}</div>
                <div className="stat-box-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Two-column: chart + table */}
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, marginBottom: 24 }}>

            {/* PRR Chart */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">PRR Signal Strength</div>
              </div>
              <div className="card-body" style={{ padding: '16px 8px 8px' }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f4f8" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={110} />
                    <Tooltip
                      formatter={(v) => [`PRR: ${v}`, 'Signal Strength']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="prr" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={PRIORITY_COLOR[entry.priority] || '#6b7280'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 8 }}>
                  {Object.entries(PRIORITY_COLOR).map(([p, c]) => (
                    <span key={p} style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Signals table */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Potential Safety Signals</div>
                  <div className="card-subtitle">{signals.length} signal{signals.length !== 1 ? 's' : ''} detected · sorted by priority and PRR</div>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Drug</th>
                      <th>Adverse Event</th>
                      <th>PRR</th>
                      <th>Reports</th>
                      <th>Priority</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((s, i) => (
                      <React.Fragment key={i}>
                        <tr className={`row-${s.priority.toLowerCase()}`}>
                          <td style={{ fontWeight: 700 }}>{s.drug}</td>
                          <td>{s.adverse_event}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, color: PRIORITY_COLOR[s.priority] }}>{s.prr}</td>
                          <td>{s.report_count}</td>
                          <td><PriorityBadge priority={s.priority} /></td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn-investigate"
                                onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                              >
                                <Search size={12} style={{ display: 'inline', marginRight: 3 }} />
                                {expandedRow === i ? 'Hide' : 'Explain'}
                              </button>
                              <button
                                className="btn-investigate"
                                style={{ background: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' }}
                                onClick={() => { onSelectSignal(s); onNavigate('copilot') }}
                              >
                                Ask AI
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedRow === i && (
                          <tr>
                            <td colSpan={6} style={{ background: '#fafbfc', padding: '10px 18px' }}>
                              <div className="explanation-text">
                                <strong>Explanation:</strong> {s.explanation}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="alert alert-info" style={{ fontSize: 12.5 }}>
            <AlertCircle size={15} />
            <span><strong>Disclaimer:</strong> {safetyResults.disclaimer}</span>
          </div>
        </>
      )}

      {!safetyResults && !anyLoading && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No safety analysis yet</div>
            <div className="empty-state-text">Upload a CSV file above and click "Analyze Safety Data" to detect potential signals.</div>
          </div>
        </div>
      )}
    </div>
  )
}
