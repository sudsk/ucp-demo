import React from 'react'
import { Star } from 'lucide-react'

export default function ProductCards({ products }) {
  if (!products?.length) return null
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(products.length, 3)}, 1fr)`,
      gap: '10px', marginTop: '10px',
    }}>
      {products.map((p, i) => {
        const hasDiscount = p.promo_pct > 0
        const price = p.effective_price ? p.effective_price : p.price
        const origPrice = p.price
        return (
          <div key={p.id || i} style={{
            background: 'var(--navy-light)', border: '1px solid var(--border)',
            borderRadius: '10px', overflow: 'hidden',
            animation: `fadeUp 0.4s ease ${i * 80}ms both`,
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--teal)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {/* Image area */}
            <div style={{
              height: '100px', background: 'linear-gradient(135deg, #1A2E42, #243B53)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {p.image_url
                ? <img src={p.image_url} alt={p.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                    onError={e => { e.target.style.display='none' }}
                  />
                : <span style={{ fontFamily:'var(--font-display)', fontSize:'12px', color:'var(--teal)', fontWeight:700, padding:'0 12px', textAlign:'center' }}>{p.title}</span>
              }
              {hasDiscount && (
                <span style={{
                  position: 'absolute', top: '8px', left: '8px',
                  background: 'rgba(249,115,22,0.9)', color: '#fff',
                  fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: '700',
                  padding: '2px 6px', borderRadius: '3px',
                }}>-{p.promo_pct}%</span>
              )}
              <span style={{
                position: 'absolute', top: '8px', right: '8px',
                background: 'rgba(34,197,94,0.2)', border: '1px solid #22C55E',
                color: '#22C55E', fontSize: '9px', fontFamily: 'var(--font-mono)',
                padding: '2px 6px', borderRadius: '3px',
              }}>IN STOCK</span>
            </div>

            {/* Info */}
            <div style={{ padding: '10px' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'13px', fontWeight:700, color:'var(--off-white)', marginBottom:'6px', lineHeight:1.2 }}>
                {p.title}
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:'6px' }}>
                <span style={{ fontFamily:'var(--font-display)', fontSize:'18px', fontWeight:800, color:'var(--teal)' }}>
                  {price}
                </span>
                {hasDiscount && origPrice !== price && (
                  <span style={{ fontSize:'11px', color:'var(--muted)', textDecoration:'line-through' }}>{origPrice}</span>
                )}
              </div>
              {hasDiscount && (
                <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'4px', fontSize:'9px', color:'var(--yellow)', fontFamily:'var(--font-mono)' }}>
                  <Star size={9} /> PROMO DISCOUNT APPLIED
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
