import React, { useState, useEffect, useRef, useCallback } from 'react'
import ProductCards from './components/ProductCards.jsx'
import { CheckoutCard, ReceiptCard } from './components/OrderCards.jsx'
import UCPBadge from './components/UCPBadge.jsx'

const API = ''

const PERSONA = { id: 'james', name: 'James Mitchell', email: 'james.mitchell@gmail.com', tier: 'Gold', hint: '5% loyalty', initials: 'JM' }

const SHOPPING_RESULTS = {
  default: [
    { store: 'Cymbal Sports', storeLogo: '🏃', price: '£109.99', rating: 4.8, reviews: 2341, title: 'ASICS Gel-Nimbus 25', ucpReady: true },
    { store: 'JD Sports', storeLogo: '🛒', price: '£84.99', rating: 4.5, reviews: 891, title: 'Nike Pegasus 39', ucpReady: false },
    { store: 'Foot Locker', storeLogo: '👟', price: '£139.99', rating: 4.6, reviews: 1204, title: 'Adidas Ultraboost 22', ucpReady: false },
    { store: 'Sports Direct', storeLogo: '⚡', price: '£74.99', rating: 4.2, reviews: 3102, title: 'Nike Air Max 90', ucpReady: false },
  ],
  adidas: [
    { store: 'Cymbal Sports', storeLogo: '🏃', price: '£159.99', rating: 4.9, reviews: 1876, title: 'Adidas Ultraboost 22 — White / Men / Size 8', ucpReady: true },
    { store: 'JD Sports', storeLogo: '🛒', price: '£149.99', rating: 4.7, reviews: 2204, title: 'Adidas Ultraboost 22 — White / Men / Size 8', ucpReady: false },
    { store: 'Sports Direct', storeLogo: '⚡', price: '£134.99', rating: 4.3, reviews: 987, title: 'Adidas Ultraboost 22 — White / Men / Size 8', ucpReady: false },
    { store: 'Foot Locker', storeLogo: '👟', price: '£159.00', rating: 4.6, reviews: 743, title: 'Adidas Ultraboost 22 — White / Men / Size 8', ucpReady: false },
  ],
}

function detectQueryType(text) {
  return text.toLowerCase().includes('adidas') ? 'adidas' : 'default'
}

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')   // **bold**
    .replace(/\*(.*?)\*/g, '$1')        // *italic*
    .replace(/^[\*\-] /gm, '• ')        // bullet points -> •
    .trim()
}

function GoogleG({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

// ── Google Wallet modal ───────────────────────────────────────────────────────
function WalletModal({ onConfirm, visible }) {
  const [closing, setClosing] = useState(false)

  const confirm = () => {
    setClosing(true)
    setTimeout(onConfirm, 320)
  }

  if (!visible) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: closing ? 'walletFadeOut 0.3s ease forwards' : 'walletFadeIn 0.25s ease forwards' }}>
      <div style={{ background: '#fff', borderRadius: '28px', width: '400px', maxWidth: '92vw', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', animation: closing ? 'walletSlideDown 0.3s ease forwards' : 'walletSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #f1f3f4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#4285F4 0%,#34A853 50%,#FBBC05 75%,#EA4335 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M21 7.28V5c0-1.1-.9-2-2-2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2.28A2 2 0 0 0 22 15v-6a2 2 0 0 0-1-1.72zM20 15h-5v-4h5v4zm0-6H14c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h6v2H5V5h14v4z" /></svg>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#202124', fontFamily: '"Google Sans",Arial,sans-serif' }}>Google Wallet</div>
              <div style={{ fontSize: '13px', color: '#5f6368', fontFamily: '"Google Sans",Arial,sans-serif', marginTop: '2px' }}>Identity detected for this session</div>
            </div>
          </div>

          {/* Account row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: '#f8f9fa', borderRadius: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: '"Google Sans",Arial,sans-serif', flexShrink: 0 }}>
              {PERSONA.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 500, color: '#202124', fontFamily: '"Google Sans",Arial,sans-serif' }}>{PERSONA.name}</div>
              <div style={{ fontSize: '13px', color: '#5f6368', fontFamily: '"Google Sans",Arial,sans-serif', marginTop: '1px' }}>{PERSONA.email}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '10px', background: 'rgba(251,191,36,0.15)', color: '#92400e', fontFamily: '"Google Sans",Arial,sans-serif' }}>{PERSONA.tier}</span>
              <div style={{ fontSize: '11px', color: '#34A853', fontFamily: '"Google Sans",Arial,sans-serif', marginTop: '4px' }}>{PERSONA.hint}</div>
            </div>
          </div>
        </div>

        {/* Confirm */}
        <div style={{ padding: '20px 28px 24px' }}>
          <button onClick={confirm}
            style={{ width: '100%', padding: '13px', borderRadius: '24px', border: 'none', background: '#1a73e8', color: '#fff', fontSize: '15px', fontWeight: 600, fontFamily: '"Google Sans",Arial,sans-serif', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1557b0'}
            onMouseLeave={e => e.currentTarget.style.background = '#1a73e8'}
          >
            Continue as James Mitchell
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Google Shopping shelf ─────────────────────────────────────────────────────
function ShoppingShelf({ results, onBuy }) {
  if (!results?.length) return null
  return (
    <div style={{ marginTop: '16px', background: '#fff', border: '1px solid #e8eaed', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(60,64,67,0.1)' }}>
      <div style={{ padding: '10px 16px', background: '#f8f9fa', borderBottom: '1px solid #f1f3f4', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#5f6368"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.1 17 7 17h11v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H16c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20.5 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" /></svg>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#202124', fontFamily: '"Google Sans",Arial,sans-serif' }}>Shopping</span>
        <span style={{ fontSize: '12px', color: '#5f6368', fontFamily: '"Google Sans",Arial,sans-serif' }}>{results.length} stores</span>
      </div>

      {results.map((r, i) => (
        <div key={i}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < results.length - 1 ? '1px solid #f1f3f4' : 'none', background: r.ucpReady ? '#fafffe' : 'transparent', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = r.ucpReady ? '#f0fffe' : '#f8f9fa'}
          onMouseLeave={e => e.currentTarget.style.background = r.ucpReady ? '#fafffe' : 'transparent'}
        >
          <span style={{ fontSize: '20px', width: '26px', textAlign: 'center', flexShrink: 0 }}>{r.storeLogo}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#202124', fontFamily: '"Google Sans",Arial,sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '12px', color: '#5f6368', fontFamily: '"Google Sans",Arial,sans-serif' }}>{r.store}</span>
              <span style={{ fontSize: '11px', color: '#FBBC05' }}>{'★'.repeat(Math.floor(r.rating))}</span>
              <span style={{ fontSize: '11px', color: '#5f6368' }}>{r.rating} ({r.reviews.toLocaleString()})</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#202124', fontFamily: '"Google Sans",Arial,sans-serif' }}>{r.price}</div>
            {r.ucpReady ? (
              <button onClick={() => onBuy(r)}
                style={{ marginTop: '5px', padding: '6px 14px', borderRadius: '20px', border: 'none', background: '#1a73e8', color: '#fff', fontSize: '12px', fontWeight: 600, fontFamily: '"Google Sans",Arial,sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1557b0'}
                onMouseLeave={e => e.currentTarget.style.background = '#1a73e8'}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M21 7.28V5c0-1.1-.9-2-2-2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2.28A2 2 0 0 0 22 15v-6a2 2 0 0 0-1-1.72zM20 15h-5v-4h5v4zm0-6H14c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h6v2H5V5h14v4z" /></svg>
                Buy with Google Wallet
              </button>
            ) : (
              <div style={{ marginTop: '5px', fontSize: '12px', color: '#1a73e8', fontFamily: '"Google Sans",Arial,sans-serif', cursor: 'pointer' }}>Visit site →</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', animation: 'aimFadeUp 0.2s ease forwards' }}>
      <div style={{ width: '28px', height: '28px', flexShrink: 0 }}><GoogleG size={28} /></div>
      <div style={{ display: 'flex', gap: '5px', padding: '10px 14px', background: '#f1f3f4', borderRadius: '18px' }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#80868b', animation: `aimDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
      </div>
    </div>
  )
}

// ── Message ───────────────────────────────────────────────────────────────────
function Message({ msg, onBuy }) {
  const isUser = msg.role === 'user'
  if (msg.type === 'typing') return <TypingDots />
  return (
    <div style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: '10px', marginBottom: '24px', animation: 'aimFadeUp 0.22s ease forwards' }}>
      {isUser
        ? <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1a73e8', flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', fontFamily: '"Google Sans",Arial,sans-serif' }}>{PERSONA.initials}</div>
        : <div style={{ width: '28px', height: '28px', flexShrink: 0, marginTop: '2px' }}><GoogleG size={28} /></div>
      }
      <div style={{ maxWidth: '82%', minWidth: 0 }}>
        {!isUser && msg.lastTool && <UCPBadge tool={msg.lastTool} />}
        {msg.text && (
          <div style={{ background: isUser ? '#1a73e8' : 'transparent', color: isUser ? '#fff' : '#202124', borderRadius: isUser ? '18px 4px 18px 18px' : '0', padding: isUser ? '10px 16px' : '4px 0', fontSize: '15px', lineHeight: '1.65', fontFamily: '"Google Sans",Arial,sans-serif', whiteSpace: 'pre-wrap' }}>
            {isUser ? msg.text : stripMarkdown(msg.text)}
          </div>
        )}
        {msg.shoppingResults && <ShoppingShelf results={msg.shoppingResults} onBuy={onBuy} />}
        {msg.products && <ProductCards products={msg.products} />}
        {msg.checkout && <CheckoutCard result={msg.checkout} />}
        {msg.receipt && <ReceiptCard result={msg.receipt} />}
      </div>
    </div>
  )
}

// ── Zero state ────────────────────────────────────────────────────────────────
const CHIPS = [
  'Find me white Adidas trainers for men, size 8',
  'Best Nike running shoes under £100',
  'Show me ASICS Gel-Nimbus',
  'What\'s the best deal on trainers right now?',
]

function ZeroState({ onSend, loading }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '48px 24px 32px', gap: '28px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}><GoogleG size={54} /></div>
        <h1 style={{ fontFamily: '"Google Sans Display","Google Sans",Arial,sans-serif', fontSize: '36px', fontWeight: 400, color: '#202124', margin: 0 }}>
          Hi James, what are you looking for?
        </h1>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '600px' }}>
        {CHIPS.map((q, i) => (
          <button key={i} onClick={() => onSend(q)} disabled={loading}
            style={{ padding: '10px 18px', borderRadius: '24px', border: '1px solid #dadce0', background: '#fff', color: '#202124', fontSize: '14px', fontFamily: '"Google Sans",Arial,sans-serif', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(60,64,67,0.08)' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.borderColor = '#1a73e8' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#dadce0' }}
          >{q}</button>
        ))}
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)
  const [showZero, setShowZero] = useState(true)
  const checkoutActiveRef = useRef(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  // Wallet modal fires on load
  useEffect(() => { const t = setTimeout(() => setWalletOpen(true), 700); return () => clearTimeout(t) }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const addMsg = useCallback(msg => setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }]), [])

  const handleWalletConfirm = useCallback(() => {
    setWalletOpen(false)
    setSessionActive(true)
  }, [])

  const sendToBackend = useCallback(async (userText) => {
    if (loading) return
    setLoading(true)
    const history = messages.filter(m => m.text && !m.type && !m.shoppingResults).map(m => ({ role: m.role, content: m.text }))
    const typingId = `t-${Date.now()}`
    setMessages(prev => [...prev, { id: typingId, type: 'typing' }])
    let aId = null
    const initA = () => {
      if (aId) return
      aId = `a-${Date.now()}`
      setMessages(prev => [...prev.filter(m => m.id !== typingId), { id: aId, role: 'assistant', text: '', lastTool: null, products: null, checkout: null, receipt: null }])
    }
    try {
      const res = await fetch(`${API}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [...history, { role: 'user', content: userText }] }) })
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buf = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim(); if (!raw) continue
          let ev; try { ev = JSON.parse(raw) } catch { continue }
          if (ev.type === 'text') { initA(); setMessages(prev => prev.map(m => m.id === aId ? { ...m, text: (m.text || '') + ev.content } : m)) }
          if (ev.type === 'tool_call') { initA(); setMessages(prev => prev.map(m => m.id === aId ? { ...m, lastTool: ev.tool } : m)) }
          if (ev.type === 'tool_result') {
            initA(); const r = ev.result
            if (ev.tool === 'search_products' && r.products?.length) setMessages(prev => prev.map(m => m.id === aId ? { ...m, products: r.products } : m))
            if (ev.tool === 'create_checkout' && r.checkout_id) { setMessages(prev => prev.map(m => m.id === aId ? { ...m, checkout: r } : m)); checkoutActiveRef.current = true }
            if (ev.tool === 'confirm_payment' && r.order_id) { setMessages(prev => prev.map(m => m.id === aId ? { ...m, receipt: r } : m)); checkoutActiveRef.current = false }
          }
          if (ev.type === 'error') { initA(); setMessages(prev => prev.map(m => m.id === aId ? { ...m, text: `⚠️ ${ev.content}` } : m)) }
        }
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== typingId))
      addMsg({ role: 'assistant', text: `Connection error: ${e.message}` })
    } finally { setLoading(false); inputRef.current?.focus() }
  }, [loading, messages, addMsg])

  const send = useCallback(async (text) => {
    const msg = (text || input).trim(); if (!msg || loading) return
    setInput(''); setShowZero(false)
    addMsg({ role: 'user', text: msg })
    // If checkout is in progress, all replies go to the UCP backend
    if (checkoutActiveRef.current) {
      await sendToBackend(msg)
      return
    }
    // Discovery queries show the Google Shopping shelf only
    const qt = detectQueryType(msg)
    const shelf = SHOPPING_RESULTS[qt]
    setMessages(prev => [...prev, { id: `shelf-${Date.now()}`, role: 'assistant', text: null, shoppingResults: shelf, lastTool: null }])
  }, [input, loading, addMsg, sendToBackend])

  const handleBuy = useCallback((item) => {
    setShowZero(false)
    const msg = `Buy the ${item.title} from Cymbal Sports`
    addMsg({ role: 'user', text: msg })
    sendToBackend(msg)
  }, [addMsg, sendToBackend])

  const reset = useCallback(() => {
    setMessages([]); setInput(''); setShowZero(true); setSessionActive(false); checkoutActiveRef.current = false
    setTimeout(() => setWalletOpen(true), 300)
  }, [])

  const onKey = useCallback(e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }, [send])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: '"Google Sans",Arial,sans-serif', overflow: 'hidden' }}>

      <WalletModal visible={walletOpen} onConfirm={handleWalletConfirm} />

      {/* ── Header ── */}
      <header style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #e8eaed', flexShrink: 0, background: '#fff', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <GoogleG size={32} />
          <nav style={{ display: 'flex' }}>
            {['All', 'AI Mode', 'Images', 'Videos', 'Shopping', 'News'].map(tab => (
              <div key={tab} style={{ padding: '0 14px', fontSize: '14px', cursor: 'pointer', color: tab === 'AI Mode' ? '#1a73e8' : '#5f6368', borderBottom: tab === 'AI Mode' ? '3px solid #1a73e8' : '3px solid transparent', fontWeight: tab === 'AI Mode' ? 600 : 400, lineHeight: '62px' }}>{tab}</div>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {sessionActive && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#e8f0fe', border: '1px solid #c5d7fb', borderRadius: '20px', padding: '5px 12px 5px 8px', fontSize: '13px', color: '#1a73e8', fontFamily: '"Google Sans",Arial,sans-serif' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff' }}>{PERSONA.initials}</div>
              <span style={{ fontWeight: 500 }}>{PERSONA.name}</span>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '8px', background: 'rgba(251,191,36,0.2)', color: '#92400e', fontWeight: 600 }}>{PERSONA.tier}</span>
            </div>
          )}
          <button onClick={reset}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #dadce0', background: '#fff', color: '#5f6368', fontSize: '13px', cursor: 'pointer', fontFamily: '"Google Sans",Arial,sans-serif', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a73e8'; e.currentTarget.style.color = '#1a73e8' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#dadce0'; e.currentTarget.style.color = '#5f6368' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" /></svg>
            New session
          </button>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: sessionActive ? '#1a73e8' : '#e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: sessionActive ? '#fff' : '#5f6368', flexShrink: 0 }}>
            {sessionActive ? PERSONA.initials : <svg width="18" height="18" viewBox="0 0 24 24" fill="#5f6368"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>}
          </div>
        </div>
      </header>

      {/* ── Conversation ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {showZero && messages.length === 0
          ? <ZeroState onSend={send} loading={loading} />
          : (
            <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', padding: '32px 24px', flex: 1 }}>
              {messages.map(m => <Message key={m.id} msg={m} onBuy={handleBuy} />)}
              <div ref={endRef} />
            </div>
          )
        }
      </div>

      {/* ── Input ── */}
      <div style={{ background: '#fff', padding: '14px 24px 18px', borderTop: '1px solid #e8eaed', flexShrink: 0 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', background: '#f1f3f4', borderRadius: '28px', padding: '8px 8px 8px 18px', border: '1px solid #e8eaed' }}>
            <svg style={{ flexShrink: 0, marginBottom: '8px' }} width="20" height="20" viewBox="0 0 24 24" fill="#5f6368"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
              placeholder="Search or ask anything..." disabled={loading} rows={1}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#202124', fontSize: '15px', fontFamily: '"Google Sans",Arial,sans-serif', resize: 'none', lineHeight: '1.5', maxHeight: '160px', overflowY: 'auto', padding: '4px 0' }}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px' }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', flexShrink: 0, background: loading || !input.trim() ? '#e8eaed' : '#1a73e8', color: loading || !input.trim() ? '#9aa0a6' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
              {loading
                ? <div style={{ width: '16px', height: '16px', border: '2px solid #9aa0a6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'aimSpin 0.8s linear infinite' }} />
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}