import React from 'react'

const META = {
  set_persona:     { color: '#1a73e8', label: 'Credential_Set',      step: '01', desc: 'Google Wallet identity linked · loyalty tier activated' },
  search_products: { color: '#34A853', label: 'Offer_Response',      step: '02', desc: 'UCP catalogue queried · Cymbal Sports products returned' },
  create_checkout: { color: '#FBBC05', label: 'Checkout_Session',    step: '03', desc: 'POST /checkouts · SDK-validated session created' },
  get_checkout:    { color: '#1a73e8', label: 'Checkout_State',      step: '04', desc: 'GET /checkouts/{id} · order assembled' },
  confirm_payment: { color: '#34A853', label: 'Transaction_Receipt', step: '05', desc: 'POST /checkouts/{id}/complete · order placed' },
}

export default function UCPBadge({ tool }) {
  const m = META[tool]
  if (!m) return null
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${m.color}12`, border: `1px solid ${m.color}35`, borderRadius: '8px', padding: '5px 10px 5px 6px', marginBottom: '6px', animation: 'badgePop 0.25s ease forwards' }}>
      <span style={{ background: m.color, color: '#fff', fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>{m.step}</span>
      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: m.color, fontWeight: 600 }}>{m.label}</span>
      <span style={{ fontSize: '11px', color: '#5f6368', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: '"Google Sans",Arial,sans-serif' }}>· {m.desc}</span>
    </div>
  )
}
