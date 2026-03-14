import React from 'react'

export default function ProductCards({ products }) {
  if (!products?.length) return null
  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ fontSize: '12px', color: '#5f6368', fontFamily: '"Google Sans",Arial,sans-serif', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#1a73e8"><path d="M21 7.28V5c0-1.1-.9-2-2-2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2.28A2 2 0 0 0 22 15v-6a2 2 0 0 0-1-1.72zM20 15h-5v-4h5v4zm0-6H14c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h6v2H5V5h14v4z"/></svg>
        Cymbal Sports catalogue · UCP /.well-known/ucp
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(products.length, 3)}, 1fr)`, gap: '10px' }}>
        {products.map((p, i) => {
          const hasDiscount = p.promo_pct > 0
          const price = p.effective_price || p.price
          const origPrice = p.price
          return (
            <div key={p.id || i} style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', overflow: 'hidden', animation: `fadeUp 0.35s ease ${i * 70}ms both`, transition: 'box-shadow 0.2s, border-color 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(60,64,67,0.15)'; e.currentTarget.style.borderColor = '#1a73e8' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e8eaed' }}
            >
              <div style={{ height: '90px', background: 'linear-gradient(135deg, #e8f0fe 0%, #f1f8ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                  : <span style={{ fontSize: '11px', color: '#1a73e8', fontWeight: 600, padding: '0 10px', textAlign: 'center', fontFamily: '"Google Sans",Arial,sans-serif' }}>{p.title}</span>
                }
                {hasDiscount && <span style={{ position: 'absolute', top: '7px', left: '7px', background: '#ea4335', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>-{p.promo_pct}%</span>}
                <span style={{ position: 'absolute', top: '7px', right: '7px', background: 'rgba(52,168,83,0.12)', border: '1px solid #34A853', color: '#34A853', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>IN STOCK</span>
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#202124', fontFamily: '"Google Sans",Arial,sans-serif', lineHeight: 1.3, marginBottom: '6px' }}>{p.title}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#1a73e8', fontFamily: '"Google Sans",Arial,sans-serif' }}>{price}</span>
                  {hasDiscount && origPrice !== price && <span style={{ fontSize: '12px', color: '#9aa0a6', textDecoration: 'line-through' }}>{origPrice}</span>}
                </div>
                {hasDiscount && <div style={{ marginTop: '4px', fontSize: '11px', color: '#34A853', fontFamily: '"Google Sans",Arial,sans-serif', fontWeight: 500 }}>✓ Loyalty discount applied</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
