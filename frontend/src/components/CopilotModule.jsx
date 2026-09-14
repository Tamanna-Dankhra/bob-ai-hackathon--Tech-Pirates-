import { useState, useRef, useEffect } from 'react'
import { Send, AlertTriangle, Bot } from 'lucide-react'
import { sendCopilotMessage } from '../api/client.js'

const SUGGESTIONS = [
  'Which safety signal should I investigate first?',
  'Why was the highest-priority signal flagged?',
  'Is my submission ready for regulatory review?',
  'What should I fix first to improve readiness?',
  'Summarize the key findings from my analysis.',
]

function ChatMessage({ role, content, isPlaceholder }) {
  const isUser = role === 'user'
  return (
    <div className={`chat-msg ${isUser ? 'user' : 'assistant'}`}>
      <div className={`chat-avatar ${isUser ? 'user-av' : 'ai-av'}`}>
        {isUser ? '👤' : 'AI'}
      </div>
      <div>
        {isPlaceholder && !isUser && (
          <div style={{ fontSize: 11, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 5, padding: '2px 8px', marginBottom: 5, display: 'inline-block' }}>
            Demo mode — IBM watsonx.ai not yet connected
          </div>
        )}
        <div className="chat-bubble">
          {content}
        </div>
      </div>
    </div>
  )
}

export default function CopilotModule({ safetyResults, regulatoryResults, selectedSignal }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m PharmaGuard AI Copilot. I can analyze your safety signals and regulatory readiness. Run a safety analysis or regulatory check first, then ask me anything about the results.',
      isPlaceholder: false,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Pre-fill a question when a signal is selected from Safety module
  useEffect(() => {
    if (selectedSignal) {
      setInput(`Why was ${selectedSignal.drug} / ${selectedSignal.adverse_event} flagged as a potential safety signal? PRR is ${selectedSignal.prr}.`)
    }
  }, [selectedSignal])

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg) return

    setMessages(prev => [...prev, { role: 'user', content: msg, isPlaceholder: false }])
    setInput('')
    setLoading(true)

    try {
      const result = await sendCopilotMessage(msg, {
        safety_results: safetyResults,
        regulatory_results: regulatoryResults,
      })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.answer,
        isPlaceholder: !result.watsonx_ready,
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message}`,
        isPlaceholder: false,
      }])
    } finally {
      setLoading(false)
    }
  }

  const hasContext = safetyResults || regulatoryResults

  return (
    <div>
      {/* Context status banner */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{
          flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
          padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: safetyResults ? '#10b981' : '#d1d5db', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Safety Analysis</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              {safetyResults
                ? `${safetyResults.summary.num_potential_signals} signals loaded as context`
                : 'No safety analysis — run one first for better answers'}
            </div>
          </div>
        </div>
        <div style={{
          flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
          padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: regulatoryResults ? '#10b981' : '#d1d5db', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Regulatory Analysis</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              {regulatoryResults
                ? `${regulatoryResults.readiness_percentage}% readiness loaded as context`
                : 'No regulatory check — run one first for better answers'}
            </div>
          </div>
        </div>
        {selectedSignal && (
          <div style={{
            flex: 1, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Signal Selected</div>
              <div style={{ fontSize: 12, color: '#b45309' }}>{selectedSignal.drug} / {selectedSignal.adverse_event}</div>
            </div>
          </div>
        )}
      </div>

      {/* Chat card */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #0f2044, #1a3a6b)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="#60a5fa" />
            </div>
            <div>
              <div className="card-title">PharmaGuard AI Copilot</div>
              <div className="card-subtitle">Context-aware pharmacovigilance assistant</div>
            </div>
          </div>
          {!hasContext && (
            <div style={{ fontSize: 12, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={13} />
              No analysis context yet — answers will be generic
            </div>
          )}
        </div>

        {/* Watsonx placeholder notice */}
        <div className="placeholder-banner" style={{ margin: '0 16px' }}>
          <AlertTriangle size={14} />
          <span><strong>Demo Mode:</strong> IBM watsonx.ai is not yet connected. The AI Copilot is fully wired up and context-aware — responses show the system prompt with your actual analysis data. Connect watsonx.ai to get real AI answers.</span>
        </div>

        {/* Messages */}
        <div className="chat-window">
          <div className="chat-messages">
            {messages.map((m, i) => (
              <ChatMessage key={i} role={m.role} content={m.content} isPlaceholder={m.isPlaceholder} />
            ))}
            {loading && (
              <div className="chat-msg assistant">
                <div className="chat-avatar ai-av">AI</div>
                <div className="chat-bubble" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9ca3af' }}>
                  <span className="spinner spinner-dark" style={{ borderTopColor: '#9ca3af', borderColor: 'rgba(156,163,175,.2)' }} />
                  Thinking…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div className="suggestions-row">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="suggestion-chip"
                onClick={() => sendMessage(s)}
                disabled={loading}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="chat-input-row">
            <textarea
              className="chat-input"
              rows={2}
              placeholder="Ask about your safety signals or regulatory readiness…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{ alignSelf: 'flex-end', padding: '10px 16px' }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
