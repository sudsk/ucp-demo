import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Zap, RotateCcw, User } from 'lucide-react'
import UCPBadge from './components/UCPBadge.jsx'
import ProductCards from './components/ProductCards.jsx'
import { CheckoutCard, ReceiptCard } from './components/OrderCards.jsx'

const API = ''

const PERSONAS = [
  { id: 'alex',  name: 'Alex Johnson', tier: 'Gold',   emoji: '⭐', hint: '5% loyalty' },
  { id: 'sam',   name: 'Sam Patel',    tier: 'Silver', emoji: '🥈', hint: '3% loyalty' },
  { id: 'guest', name: 'Guest',        tier: null,     emoji: '👤', hint: 'No discount' },
]

const QUICK_PROMPTS = [
  "I'm Alex — find me Nike running trainers",
  "Show me everything under £100",
  "What ASICS do you have?",
  "I'm Sam, show me the best deal you have",
]

const WELCOME = "Welcome to Cymbal Sports! I'm your AI shopping assistant, running on Gemini and the Universal Commerce Protocol (UCP 2026-01-11).\n\nSelect a demo persona above to activate loyalty discounts, or just ask me what you're looking for."

// ── Message rendering ────────────────────────────────────────────────────────

function Bubble({ msg }) {
  const isUser = msg.role === 'user'

  if (msg.type === 'typing') {
    return (
      <div style={{ display:'flex', gap:'10px', marginBottom:'16px', alignItems:'flex-start' }}>
        <Avatar />
        <div style={{ background:'var(--navy-mid)', border:'1px solid var(--border)', borderRadius:'4px 14px 14px 14px', padding:'10px 14px' }}>
          <span style={{ display:'flex', gap:'4px', alignItems:'center' }}>
            {[0,1,2].map(i => <span key={i} style={{ width:'5px', height:'5px', borderRadius:'50%', background:'var(--muted)', animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`, display:'inline-block' }} />)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap:'10px', alignItems:'flex-start', marginBottom:'16px', animation:'fadeUp 0.25s ease forwards' }}>
      {isUser
        ? <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'var(--navy-light)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><User size={14} color="var(--muted)" /></div>
        : <Avatar />
      }
      <div style={{ maxWidth:'78%', minWidth:0 }}>
        {/* UCP badge — pinned to last tool call */}
        {!isUser && msg.lastTool && <UCPBadge tool={msg.lastTool} />}

        {/* Text bubble */}
        {msg.text && (
          <div style={{
            background: isUser ? 'var(--teal)' : 'var(--navy-mid)',
            color: isUser ? 'var(--navy)' : 'var(--off-white)',
            borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
            padding: '10px 14px', fontSize:'14px', lineHeight:'1.55',
            fontWeight: isUser ? 500 : 400,
            border: isUser ? 'none' : '1px solid var(--border)',
            whiteSpace: 'pre-wrap',
          }}>{msg.text}</div>
        )}

        {/* Rich cards — rendered from tool results */}
        {msg.products && <ProductCards products={msg.products} />}
        {msg.checkout && <CheckoutCard result={msg.checkout} />}
        {msg.receipt  && <ReceiptCard  result={msg.receipt}  />}
      </div>
    </div>
  )
}

function Avatar() {
  return (
    <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg, var(--teal), var(--blue))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <Zap size={14} color="var(--navy)" />
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [messages, setMessages]       = useState([{ id:'w', role:'assistant', text:WELCOME }])
  const [input, setInput]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [persona, setPersona]         = useState('guest')
  const [ucpCalls, setUcpCalls]       = useState(0)
  const [showPrompts, setShowPrompts] = useState(true)
  const endRef   = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const addMsg = useCallback((msg) => setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }]), [])
  const updateLast = useCallback((updater) => setMessages(prev => {
    const copy = [...prev]
    copy[copy.length - 1] = updater(copy[copy.length - 1])
    return copy
  }), [])

  const handlePersona = useCallback((id) => {
    setPersona(id)
    const p = PERSONAS.find(x => x.id === id)
    addMsg({
      role: 'assistant',
      lastTool: 'set_persona',
      text: id === 'guest'
        ? 'Shopping as a guest — no loyalty discounts.'
        : `Identity set: ${p.name} (${p.tier} tier, ${p.hint}). Your discount will apply automatically at checkout.`,
    })
  }, [addMsg])

  const send = useCallback(async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setShowPrompts(false)
    setLoading(true)

    // Build full conversation history for the backend
    const history = messages
      .filter(m => m.text && !m.type)
      .map(m => ({ role: m.role, content: m.text }))

    addMsg({ role:'user', text:msg })

    // Typing indicator
    const typingId = `typing-${Date.now()}`
    setMessages(prev => [...prev, { id:typingId, type:'typing' }])

    // The current assistant message being built
    let aId = null
    const initAssistant = () => {
      if (aId) return
      aId = `a-${Date.now()}`
      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.id !== typingId)
        return [...withoutTyping, { id: aId, role:'assistant', text:'', lastTool:null, products:null, checkout:null, receipt:null }]
      })
    }

    try {
      const res = await fetch(`${API}/chat`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messages: [...history, { role:'user', content: msg }] }),
      })

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream:true })
        const lines = buf.split('\n')
        buf = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue
          let ev
          try { ev = JSON.parse(raw) } catch { continue }

          if (ev.type === 'text') {
            initAssistant()
            setMessages(prev => prev.map(m => m.id === aId ? { ...m, text: (m.text || '') + ev.content } : m))
          }

          else if (ev.type === 'tool_call') {
            initAssistant()
            setUcpCalls(c => c + 1)
            setMessages(prev => prev.map(m => m.id === aId ? { ...m, lastTool: ev.tool } : m))
          }

          else if (ev.type === 'tool_result') {
            initAssistant()
            const r = ev.result
            // Map tool results to rich UI cards
            if (ev.tool === 'search_products' && r.products?.length) {
              setMessages(prev => prev.map(m => m.id === aId ? { ...m, products: r.products } : m))
            }
            if (ev.tool === 'create_checkout' && r.checkout_id) {
              setMessages(prev => prev.map(m => m.id === aId ? { ...m, checkout: r } : m))
            }
            if (ev.tool === 'confirm_payment' && r.order_id) {
              setMessages(prev => prev.map(m => m.id === aId ? { ...m, receipt: r } : m))
            }
          }

          else if (ev.type === 'error') {
            initAssistant()
            setMessages(prev => prev.map(m => m.id === aId ? { ...m, text:`⚠ ${ev.content}` } : m))
          }
        }
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== typingId))
      addMsg({ role:'assistant', text:`Connection error: ${e.message}` })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, messages, addMsg])

  const reset = useCallback(() => {
    setMessages([{ id:'w', role:'assistant', text:WELCOME }])
    setUcpCalls(0)
    setShowPrompts(true)
    setPersona('guest')
    setInput('')
  }, [])

  const onKey = useCallback(e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }, [send])

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'var(--navy)', position:'relative', overflow:'hidden' }}>

      {/* Grid texture */}
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(rgba(0,194,178,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(0,194,178,0.03) 1px, transparent 1px)`, backgroundSize:'40px 40px', pointerEvents:'none' }} />

      {/* ── Header ── */}
      <header style={{ background:'rgba(13,27,42,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid var(--border)', padding:'0 24px', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, position:'relative', zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'32px', height:'32px', background:'linear-gradient(135deg, var(--teal), var(--blue))', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={16} color="var(--navy)" />
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'16px', fontWeight:800, color:'var(--white)', letterSpacing:'-0.01em', lineHeight:1 }}>CYMBAL SPORTS</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--teal)', letterSpacing:'0.08em' }}>GEMINI · UCP 2026-01-11</div>
            </div>
          </div>

          <div style={{ width:'1px', height:'28px', background:'var(--border)' }} />

          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'var(--teal)', animation: loading ? 'pulse 1s infinite' : 'none' }} />
            <span style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--muted)' }}>{ucpCalls} UCP calls</span>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--muted)', background:'var(--navy-mid)', border:'1px solid var(--border)', padding:'4px 8px', borderRadius:'4px' }}>
            /.well-known/ucp
          </div>
          <button onClick={reset} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'6px', border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', fontSize:'12px', fontFamily:'var(--font-body)', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--teal)'; e.currentTarget.style.color='var(--teal)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--muted)' }}
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </header>

      {/* ── Persona Bar ── */}
      <div style={{ background:'rgba(26,46,66,0.6)', backdropFilter:'blur(8px)', borderBottom:'1px solid var(--border)', padding:'8px 24px', display:'flex', alignItems:'center', gap:'12px', flexShrink:0, zIndex:9 }}>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--muted)', letterSpacing:'0.1em', flexShrink:0 }}>DEMO PERSONA</span>
        {PERSONAS.map(p => (
          <button key={p.id} onClick={() => !loading && handlePersona(p.id)} disabled={loading}
            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 10px', borderRadius:'20px', border:`1px solid ${persona===p.id?'var(--teal)':'var(--border)'}`, background:persona===p.id?'var(--teal-dim)':'transparent', color:persona===p.id?'var(--teal)':'var(--muted)', fontSize:'12px', fontFamily:'var(--font-body)', cursor:loading?'not-allowed':'pointer', transition:'all 0.15s', opacity:loading?0.5:1 }}>
            <span>{p.emoji}</span>
            <span style={{ fontWeight:persona===p.id?600:400 }}>{p.name}</span>
            {p.tier && <span style={{ fontSize:'9px', fontFamily:'var(--font-mono)', background:p.tier==='Gold'?'rgba(251,191,36,0.15)':'rgba(139,163,184,0.15)', color:p.tier==='Gold'?'var(--yellow)':'var(--muted)', padding:'1px 5px', borderRadius:'3px' }}>{p.tier}</span>}
          </button>
        ))}
      </div>

      {/* ── Messages ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', position:'relative', zIndex:1 }}>
        {showPrompts && messages.length <= 1 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'24px', animation:'fadeUp 0.4s ease 0.2s both' }}>
            {QUICK_PROMPTS.map((q, i) => (
              <button key={i} onClick={() => send(q)} disabled={loading}
                style={{ padding:'7px 13px', borderRadius:'20px', border:'1px solid var(--border)', background:'var(--navy-mid)', color:'var(--muted)', fontSize:'12px', fontFamily:'var(--font-body)', cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--teal)'; e.currentTarget.style.color='var(--teal)'; e.currentTarget.style.background='var(--teal-dim)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--muted)'; e.currentTarget.style.background='var(--navy-mid)' }}
              >{q}</button>
            ))}
          </div>
        )}
        {messages.map(m => <Bubble key={m.id} msg={m} />)}
        <div ref={endRef} />
      </div>

      {/* ── Input ── */}
      <div style={{ background:'rgba(13,27,42,0.97)', backdropFilter:'blur(16px)', borderTop:'1px solid var(--border)', padding:'16px 24px', flexShrink:0, position:'relative', zIndex:10 }}>
        <div style={{ display:'flex', gap:'10px', alignItems:'flex-end', maxWidth:'900px', margin:'0 auto' }}>
          <div style={{ flex:1, background:'var(--navy-mid)', border:'1px solid var(--navy-light)', borderRadius:'12px', padding:'10px 16px', display:'flex', alignItems:'center' }}>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
              placeholder="Ask me about running trainers..." disabled={loading} rows={1}
              style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'var(--off-white)', fontSize:'14px', fontFamily:'var(--font-body)', resize:'none', lineHeight:'1.5', maxHeight:'120px', overflowY:'auto' }}
              onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
            />
          </div>
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{ width:'44px', height:'44px', borderRadius:'10px', border:'none', background:loading||!input.trim()?'var(--navy-light)':'var(--teal)', color:loading||!input.trim()?'var(--muted)':'var(--navy)', display:'flex', alignItems:'center', justifyContent:'center', cursor:loading||!input.trim()?'not-allowed':'pointer', transition:'all 0.15s', flexShrink:0 }}>
            {loading
              ? <div style={{ width:'16px', height:'16px', border:'2px solid var(--muted)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              : <Send size={16} />
            }
          </button>
        </div>
        <div style={{ textAlign:'center', marginTop:'8px', fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--muted)', opacity:0.5 }}>
          UCP 2026-01-11 · dev.cymbal.mock_pay · No real transactions
        </div>
      </div>
    </div>
  )
}
