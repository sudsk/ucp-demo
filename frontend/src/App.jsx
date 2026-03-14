import React, { useState, useEffect, useRef, useCallback } from 'react'
import ProductCards from './components/ProductCards.jsx'
import { CheckoutCard, ReceiptCard } from './components/OrderCards.jsx'
import UCPBadge from './components/UCPBadge.jsx'

const API = ''

const PERSONAS = [
  { id: 'james',  name: 'James Mitchell', tier: 'Gold',   hint: '5% loyalty', initials: 'JM' },
  { id: 'sarah',  name: 'Sarah Chen',     tier: 'Silver', hint: '3% loyalty', initials: 'SC' },
  { id: 'guest',  name: 'Guest',          tier: null,     hint: 'No discount', initials: null },
]

const QUICK_PROMPTS = [
  'Find me Nike running trainers',
  'Show me everything under £100',
  'What ASICS do you have?',
  'Show me the best deal you have',
]

function GoogleLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function WalletBadge({ persona }) {
  if (!persona || persona.id === 'guest') return null
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#e8f0fe', border:'1px solid #c5d7fb', borderRadius:'20px', padding:'5px 12px 5px 8px', fontSize:'13px', color:'#1a73e8', fontFamily:'"Google Sans",Arial,sans-serif' }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="#1a73e8"><path d="M21 7.28V5c0-1.1-.9-2-2-2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2.28A2 2 0 0 0 22 15v-6a2 2 0 0 0-1-1.72zM20 15h-5v-4h5v4zm0-6H14c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h6v2H5V5h14v4z"/></svg>
      <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'#1a73e8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:700, color:'#fff' }}>{persona.initials}</div>
      <span style={{ fontWeight:500 }}>{persona.name}</span>
      {persona.tier && <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'8px', background: persona.tier==='Gold' ? 'rgba(251,191,36,0.2)':'rgba(156,163,175,0.2)', color: persona.tier==='Gold'?'#92400e':'#374151' }}>{persona.tier}</span>}
      <span style={{ fontSize:'11px', color:'#5f6368' }}>· {persona.hint}</span>
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'20px' }}>
      <div style={{ width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <GoogleLogo size={28} />
      </div>
      <div style={{ display:'flex', gap:'5px', padding:'10px 14px', background:'#f1f3f4', borderRadius:'18px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#80868b', animation:`aimDot 1.2s ease-in-out ${i*0.2}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  if (msg.type === 'typing') return <TypingDots />
  return (
    <div style={{ display:'flex', flexDirection: isUser?'row-reverse':'row', gap:'10px', marginBottom:'24px', animation:'aimFadeUp 0.2s ease forwards' }}>
      {isUser
        ? <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#1a73e8', flexShrink:0, marginTop:'2px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'#fff', fontFamily:'"Google Sans",Arial,sans-serif' }}>{msg.userInitials||'G'}</div>
        : <div style={{ width:'28px', height:'28px', flexShrink:0, marginTop:'2px' }}><GoogleLogo size={28} /></div>
      }
      <div style={{ maxWidth:'78%', minWidth:0 }}>
        {!isUser && msg.lastTool && <UCPBadge tool={msg.lastTool} />}
        {msg.text && (
          <div style={{ background: isUser?'#1a73e8':'transparent', color: isUser?'#fff':'#202124', borderRadius: isUser?'18px 4px 18px 18px':'0', padding: isUser?'10px 16px':'4px 0', fontSize:'15px', lineHeight:'1.65', fontFamily:'"Google Sans",Arial,sans-serif', whiteSpace:'pre-wrap' }}>
            {msg.text}
          </div>
        )}
        {msg.products  && <ProductCards products={msg.products} />}
        {msg.checkout  && <CheckoutCard result={msg.checkout} />}
        {msg.receipt   && <ReceiptCard  result={msg.receipt} />}
      </div>
    </div>
  )
}

function ZeroState({ onSend, loading }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:'60px 24px 40px', gap:'36px' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:'16px' }}>
          <GoogleLogo size={52} />
        </div>
        <h1 style={{ fontFamily:'"Google Sans Display","Google Sans",Arial,sans-serif', fontSize:'38px', fontWeight:400, color:'#202124', margin:0 }}>
          What are you looking for?
        </h1>
        <p style={{ fontFamily:'"Google Sans",Arial,sans-serif', fontSize:'15px', color:'#5f6368', margin:'10px 0 0' }}>
          Cymbal Sports AI Mode · Universal Commerce Protocol
        </p>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', justifyContent:'center', maxWidth:'580px' }}>
        {QUICK_PROMPTS.map((q,i) => (
          <button key={i} onClick={() => onSend(q)} disabled={loading}
            style={{ padding:'10px 20px', borderRadius:'24px', border:'1px solid #dadce0', background:'#fff', color:'#202124', fontSize:'14px', fontFamily:'"Google Sans",Arial,sans-serif', cursor:'pointer', transition:'all 0.15s', boxShadow:'0 1px 3px rgba(60,64,67,0.08)' }}
            onMouseEnter={e => { e.currentTarget.style.background='#f8f9fa'; e.currentTarget.style.borderColor='#1a73e8' }}
            onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor='#dadce0' }}
          >{q}</button>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [personaId, setPersonaId] = useState('guest')
  const [ucpCalls, setUcpCalls]   = useState(0)
  const [showZero, setShowZero]   = useState(true)
  const endRef   = useRef(null)
  const inputRef = useRef(null)

  const currentPersona = PERSONAS.find(p => p.id === personaId)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const addMsg = useCallback(msg => setMessages(prev => [...prev, { id: Date.now()+Math.random(), ...msg }]), [])

  const handlePersona = useCallback(id => {
    setPersonaId(id)
    const p = PERSONAS.find(x => x.id === id)
    if (showZero) setShowZero(false)
    addMsg({
      role:'assistant', lastTool:'set_persona',
      text: id==='guest'
        ? 'Continuing as Guest — no loyalty discounts applied.'
        : `Google Wallet identity verified: ${p.name} (${p.tier} tier, ${p.hint}). Loyalty discount will apply at checkout.`,
    })
  }, [addMsg, showZero])

  const send = useCallback(async (text) => {
    const msg = (text||input).trim()
    if (!msg||loading) return
    setInput(''); setShowZero(false); setLoading(true)
    const p = PERSONAS.find(x => x.id===personaId)
    const history = messages.filter(m=>m.text&&!m.type).map(m=>({ role:m.role, content:m.text }))
    addMsg({ role:'user', text:msg, userInitials: p?.initials||'G' })
    const typingId = `t-${Date.now()}`
    setMessages(prev => [...prev, { id:typingId, type:'typing' }])
    let aId = null
    const initA = () => {
      if (aId) return
      aId = `a-${Date.now()}`
      setMessages(prev => {
        const wo = prev.filter(m=>m.id!==typingId)
        return [...wo, { id:aId, role:'assistant', text:'', lastTool:null, products:null, checkout:null, receipt:null }]
      })
    }
    try {
      const res = await fetch(`${API}/chat`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ messages:[...history,{role:'user',content:msg}] }) })
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buf=''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value,{stream:true})
        const lines=buf.split('\n'); buf=lines.pop()||''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw=line.slice(6).trim(); if(!raw) continue
          let ev; try{ev=JSON.parse(raw)}catch{continue}
          if (ev.type==='text') { initA(); setMessages(prev=>prev.map(m=>m.id===aId?{...m,text:(m.text||'')+ev.content}:m)) }
          else if (ev.type==='tool_call') { initA(); setUcpCalls(c=>c+1); setMessages(prev=>prev.map(m=>m.id===aId?{...m,lastTool:ev.tool}:m)) }
          else if (ev.type==='tool_result') {
            initA(); const r=ev.result
            if (ev.tool==='search_products'&&r.products?.length) setMessages(prev=>prev.map(m=>m.id===aId?{...m,products:r.products}:m))
            if (ev.tool==='create_checkout'&&r.checkout_id) setMessages(prev=>prev.map(m=>m.id===aId?{...m,checkout:r}:m))
            if (ev.tool==='confirm_payment'&&r.order_id) setMessages(prev=>prev.map(m=>m.id===aId?{...m,receipt:r}:m))
          }
          else if (ev.type==='error') { initA(); setMessages(prev=>prev.map(m=>m.id===aId?{...m,text:`⚠️ ${ev.content}`}:m)) }
        }
      }
    } catch(e) {
      setMessages(prev=>prev.filter(m=>m.id!==typingId))
      addMsg({role:'assistant',text:`Connection error: ${e.message}`})
    } finally { setLoading(false); inputRef.current?.focus() }
  }, [input,loading,messages,addMsg,personaId])

  const reset = useCallback(() => { setMessages([]); setUcpCalls(0); setShowZero(true); setPersonaId('guest'); setInput('') }, [])
  const onKey = useCallback(e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }, [send])

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#fff', fontFamily:'"Google Sans",Arial,sans-serif', overflow:'hidden' }}>

      {/* ── Header ── */}
      <header style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', borderBottom:'1px solid #e8eaed', flexShrink:0, background:'#fff', zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
          <GoogleLogo size={32} />
          <nav style={{ display:'flex' }}>
            {['All','AI Mode','Images','Videos','Shopping'].map(tab => (
              <div key={tab} style={{ padding:'4px 14px', fontSize:'14px', cursor:'pointer', color: tab==='AI Mode'?'#1a73e8':'#5f6368', borderBottom: tab==='AI Mode'?'3px solid #1a73e8':'3px solid transparent', fontWeight: tab==='AI Mode'?600:400, marginBottom:'-1px' }}>{tab}</div>
            ))}
          </nav>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <WalletBadge persona={personaId!=='guest'?currentPersona:null} />
          <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'#e8f0fe', borderRadius:'12px', padding:'4px 10px', fontSize:'12px', color:'#1a73e8' }}>
            <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#34A853' }} />
            UCP · {ucpCalls} calls
          </div>
          <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#1a73e8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:'#fff', cursor:'pointer', flexShrink:0 }}>
            {currentPersona?.initials||'G'}
          </div>
        </div>
      </header>

      {/* ── Identity bar ── */}
      <div style={{ background:'#f8f9fa', borderBottom:'1px solid #e8eaed', padding:'8px 20px', display:'flex', alignItems:'center', gap:'8px', flexShrink:0, flexWrap:'wrap' }}>
        <span style={{ fontSize:'12px', color:'#5f6368', fontWeight:500, marginRight:'4px' }}>Google Wallet identity:</span>
        {PERSONAS.map(p => (
          <button key={p.id} onClick={()=>!loading&&handlePersona(p.id)} disabled={loading}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'5px 12px', borderRadius:'20px', border:`1px solid ${personaId===p.id?'#1a73e8':'#dadce0'}`, background:personaId===p.id?'#e8f0fe':'#fff', color:personaId===p.id?'#1a73e8':'#5f6368', fontSize:'13px', cursor:loading?'not-allowed':'pointer', transition:'all 0.15s', opacity:loading?0.6:1, fontFamily:'"Google Sans",Arial,sans-serif' }}>
            {p.initials
              ? <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:personaId===p.id?'#1a73e8':'#9aa0a6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:700, color:'#fff' }}>{p.initials}</div>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="#9aa0a6"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            }
            <span style={{ fontWeight:personaId===p.id?600:400 }}>{p.name}</span>
            {p.tier && <span style={{ fontSize:'10px', padding:'1px 5px', borderRadius:'8px', background:p.tier==='Gold'?'rgba(251,191,36,0.2)':'rgba(156,163,175,0.2)', color:p.tier==='Gold'?'#92400e':'#374151' }}>{p.tier}</span>}
          </button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{ fontSize:'11px', color:'#9aa0a6', fontFamily:'monospace' }}>/.well-known/ucp · 2026-01-11</span>
          <button onClick={reset} style={{ padding:'5px 14px', borderRadius:'20px', border:'1px solid #dadce0', background:'#fff', color:'#5f6368', fontSize:'13px', cursor:'pointer', fontFamily:'"Google Sans",Arial,sans-serif', transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#1a73e8';e.currentTarget.style.color='#1a73e8'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#dadce0';e.currentTarget.style.color='#5f6368'}}>
            New thread
          </button>
        </div>
      </div>

      {/* ── Conversation ── */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {showZero && messages.length===0
          ? <ZeroState onSend={send} loading={loading} />
          : (
            <div style={{ maxWidth:'760px', width:'100%', margin:'0 auto', padding:'32px 24px', flex:1 }}>
              {messages.map(m => <Message key={m.id} msg={m} />)}
              <div ref={endRef} />
            </div>
          )
        }
      </div>

      {/* ── Input ── */}
      <div style={{ background:'#fff', padding:'16px 24px 20px', borderTop:'1px solid #e8eaed', flexShrink:0 }}>
        <div style={{ maxWidth:'760px', margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'8px', background:'#f1f3f4', borderRadius:'28px', padding:'8px 8px 8px 18px', border:'1px solid #e8eaed' }}>
            <svg style={{ flexShrink:0, marginBottom:'8px' }} width="20" height="20" viewBox="0 0 24 24" fill="#5f6368"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey}
              placeholder="Ask anything about running trainers..." disabled={loading} rows={1}
              style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#202124', fontSize:'15px', fontFamily:'"Google Sans",Arial,sans-serif', resize:'none', lineHeight:'1.5', maxHeight:'160px', overflowY:'auto', padding:'4px 0' }}
              onInput={e=>{e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,160)+'px'}}
            />
            <button onClick={()=>send()} disabled={loading||!input.trim()} style={{ width:'40px', height:'40px', borderRadius:'50%', border:'none', flexShrink:0, background:loading||!input.trim()?'#e8eaed':'#1a73e8', color:loading||!input.trim()?'#9aa0a6':'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:loading||!input.trim()?'not-allowed':'pointer', transition:'all 0.2s' }}>
              {loading
                ? <div style={{ width:'16px', height:'16px', border:'2px solid #9aa0a6', borderTopColor:'transparent', borderRadius:'50%', animation:'aimSpin 0.8s linear infinite' }} />
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
              }
            </button>
          </div>
          <div style={{ textAlign:'center', marginTop:'10px', fontSize:'11px', color:'#9aa0a6' }}>
            AI Mode with UCP 2026-01-11 · dev.cymbal.mock_pay · No real transactions
          </div>
        </div>
      </div>
    </div>
  )
}
