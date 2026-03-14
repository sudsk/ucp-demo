import React from 'react'

export function CheckoutCard({ result }) {
  if (!result?.checkout_id) return null
  const rows = [
    { label: 'Subtotal',  value: result.subtotal },
    { label: 'Discount',  value: result.discount ? `-${result.discount}` : '£0.00' },
    { label: 'VAT (20%)', value: result.vat },
    { label: 'Delivery',  value: result.delivery },
  ]
  return (
    <div style={{ marginTop: '12px', background: '#fff', border: '1px solid #e8eaed', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(60,64,67,0.08)' }}>
      <div style={{ padding: '12px 16px', background: '#f8f9fa', borderBottom: '1px solid #e8eaed', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1a73e8"><path d="M21 7.28V5c0-1.1-.9-2-2-2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2.28A2 2 0 0 0 22 15v-6a2 2 0 0 0-1-1.72zM20 15h-5v-4h5v4zm0-6H14c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h6v2H5V5h14v4z"/></svg>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#202124', fontFamily: '"Google Sans",Arial,sans-serif' }}>UCP Checkout · Cymbal Sports</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', background: '#e8f0fe', color: '#1a73e8', padding: '2px 8px', borderRadius: '8px', fontWeight: 600 }}>{result.status?.toUpperCase()}</span>
      </div>
      <div style={{ padding: '14px 16px' }}>
        {result.line_items?.map((li, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#202124', fontFamily: '"Google Sans",Arial,sans-serif' }}>
            <span>{li.title} × {li.qty}</span>
            <span style={{ fontWeight: 500 }}>{li.unit_price}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #f1f3f4', paddingTop: '10px', marginTop: '6px' }}>
          {rows.map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '13px', color: '#5f6368', fontFamily: '"Google Sans",Arial,sans-serif' }}>{r.label}</span>
              <span style={{ fontSize: '13px', color: '#5f6368', fontFamily: '"Google Sans",Arial,sans-serif' }}>{r.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e8eaed' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#202124', fontFamily: '"Google Sans",Arial,sans-serif' }}>Total</span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#1a73e8', fontFamily: '"Google Sans",Arial,sans-serif' }}>{result.total}</span>
          </div>
        </div>
        {result.loyalty_note && (
          <div style={{ marginTop: '10px', padding: '8px 12px', background: '#e6f4ea', borderRadius: '8px', fontSize: '12px', color: '#34A853', fontFamily: '"Google Sans",Arial,sans-serif', fontWeight: 500 }}>
            ✓ {result.loyalty_note}
          </div>
        )}
      </div>
    </div>
  )
}

export function ReceiptCard({ result }) {
  if (!result?.order_id) return null
  return (
    <div style={{ marginTop: '12px', background: '#fff', border: '1px solid #34A853', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(52,168,83,0.12)' }}>
      <div style={{ padding: '12px 16px', background: '#e6f4ea', borderBottom: '1px solid rgba(52,168,83,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#34A853"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#137333', fontFamily: '"Google Sans",Arial,sans-serif' }}>Order Confirmed · UCP Transaction Complete</span>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          {[
            { label: 'Order ID',      value: result.order_id,            mono: true },
            { label: 'Total Charged', value: result.total_charged,       big: true },
            { label: 'Delivery',      value: result.estimated_delivery },
            { label: 'Payment',       value: result.payment_handler },
          ].map(f => (
            <div key={f.label} style={{ background: '#f8f9fa', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ fontSize: '10px', color: '#9aa0a6', fontFamily: '"Google Sans",Arial,sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{f.label}</div>
              <div style={{ fontSize: f.big ? '17px' : '13px', fontWeight: f.big ? 700 : 500, color: f.big ? '#1a73e8' : '#202124', fontFamily: f.mono ? 'monospace' : '"Google Sans",Arial,sans-serif' }}>{f.value}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#e6f4ea', border: '1px solid rgba(52,168,83,0.2)', borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#34A853"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
          <span style={{ fontSize: '13px', color: '#137333', fontFamily: '"Google Sans",Arial,sans-serif' }}>{result.description}</span>
        </div>
      </div>
    </div>
  )
}
