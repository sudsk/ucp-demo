import React from 'react'
import { Package, CheckCircle, Truck } from 'lucide-react'

export function CheckoutCard({ result }) {
  if (!result?.checkout_id) return null
  const rows = [
    { label: 'Subtotal',  value: result.subtotal },
    { label: 'Discount',  value: result.discount ? `-${result.discount}` : '£0.00' },
    { label: 'VAT (20%)', value: result.vat },
    { label: 'Delivery',  value: result.delivery },
  ]
  return (
    <div style={{
      background: 'var(--navy-light)', border: '1px solid rgba(61,187,219,0.3)',
      borderRadius: '10px', padding: '14px', marginTop: '10px',
      animation: 'fadeUp 0.4s ease forwards',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px', paddingBottom:'10px', borderBottom:'1px solid var(--border)' }}>
        <Package size={14} color="var(--blue)" />
        <span style={{ fontFamily:'var(--font-display)', fontSize:'13px', fontWeight:700, color:'var(--blue)' }}>Checkout Summary</span>
        <span style={{ marginLeft:'auto', fontFamily:'var(--font-mono)', fontSize:'9px', background:'rgba(61,187,219,0.15)', border:'1px solid rgba(61,187,219,0.3)', color:'var(--blue)', padding:'2px 6px', borderRadius:'3px' }}>
          {result.status?.toUpperCase()}
        </span>
      </div>

      {result.line_items?.map((li, i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
          <span style={{ fontSize:'13px', color:'var(--off-white)' }}>{li.title} × {li.qty}</span>
          <span style={{ fontSize:'13px', fontFamily:'var(--font-mono)', color:'var(--off-white)' }}>{li.unit_price}</span>
        </div>
      ))}

      <div style={{ borderTop:'1px solid var(--border)', paddingTop:'10px', marginTop:'6px' }}>
        {rows.map(r => (
          <div key={r.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
            <span style={{ fontSize:'12px', color:'var(--muted)' }}>{r.label}</span>
            <span style={{ fontSize:'12px', fontFamily:'var(--font-mono)', color:'var(--muted)' }}>{r.value}</span>
          </div>
        ))}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'8px', paddingTop:'8px', borderTop:'1px solid var(--border)' }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:'14px', fontWeight:700, color:'var(--off-white)' }}>Total</span>
          <span style={{ fontFamily:'var(--font-display)', fontSize:'18px', fontWeight:800, color:'var(--teal)' }}>{result.total}</span>
        </div>
      </div>
      {result.loyalty_note && (
        <div style={{ marginTop:'8px', fontSize:'10px', color:'var(--yellow)', fontFamily:'var(--font-mono)' }}>⭐ {result.loyalty_note}</div>
      )}
    </div>
  )
}

export function ReceiptCard({ result }) {
  if (!result?.order_id) return null
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(0,194,178,0.08))',
      border: '1px solid rgba(34,197,94,0.3)',
      borderRadius: '10px', padding: '14px', marginTop: '10px',
      animation: 'fadeUp 0.4s ease forwards',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
        <CheckCircle size={16} color="var(--green)" />
        <span style={{ fontFamily:'var(--font-display)', fontSize:'14px', fontWeight:700, color:'var(--green)' }}>Order Confirmed</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'10px' }}>
        {[
          { label:'Order ID',     value: result.order_id,       mono: true },
          { label:'Total Charged',value: result.total_charged,  big: true },
          { label:'Delivery',     value: result.estimated_delivery },
          { label:'Payment',      value: result.payment_handler },
        ].map(f => (
          <div key={f.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:'6px', padding:'8px' }}>
            <div style={{ fontSize:'9px', fontFamily:'var(--font-mono)', color:'var(--muted)', letterSpacing:'0.08em', marginBottom:'3px' }}>{f.label.toUpperCase()}</div>
            <div style={{ fontSize: f.big ? '16px' : '12px', fontWeight:700, color: f.big ? 'var(--teal)' : 'var(--off-white)', fontFamily: f.mono || f.big ? 'var(--font-mono)' : 'var(--font-body)' }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'6px', padding:'8px 10px', display:'flex', alignItems:'center', gap:'8px' }}>
        <Truck size={12} color="var(--green)" />
        <span style={{ fontSize:'12px', color:'var(--green)' }}>{result.description}</span>
      </div>
    </div>
  )
}
