import React from 'react'

const META = {
  set_persona:      { color: '#A78BFA', label: 'Credential_Set',      step: '01', desc: 'Identity linked · loyalty tier activated' },
  search_products:  { color: '#00C2B2', label: 'Offer_Response',      step: '02', desc: 'UCP catalogue queried · products returned' },
  create_checkout:  { color: '#F97316', label: 'Checkout_Session',    step: '03', desc: 'POST /checkouts · SDK-validated session created' },
  get_checkout:     { color: '#3DBBDB', label: 'Checkout_State',      step: '04', desc: 'GET /checkouts/{id} · order assembled' },
  confirm_payment:  { color: '#22C55E', label: 'Transaction_Receipt', step: '05', desc: 'POST /checkouts/{id}/complete · order placed' },
}

export default function UCPBadge({ tool }) {
  const m = META[tool]
  if (!m) return null
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      background: `${m.color}15`, border: `1px solid ${m.color}45`,
      borderRadius: '6px', padding: '5px 10px 5px 6px',
      marginBottom: '6px', animation: 'badgePop 0.3s ease forwards',
    }}>
      <span style={{
        background: m.color, color: '#0D1B2A',
        fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: '700',
        padding: '2px 6px', borderRadius: '3px', letterSpacing: '0.05em',
      }}>{m.step}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: m.color, fontWeight: '600' }}>
        {m.label}
      </span>
      <span style={{ fontSize: '10px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        · {m.desc}
      </span>
    </div>
  )
}
