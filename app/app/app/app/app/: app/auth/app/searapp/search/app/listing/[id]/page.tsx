tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getListingById } from '@/lib/data'

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const l = await getListingById(decodeURIComponent(id))
  if (!l) notFound()

  const rooms = [
    ['Sitting Room', l.sittingRoom], ['Bedroom', l.bedroom],
    ['Kitchen', l.kitchen], ['Washroom', l.washroom]
  ] as const

  return (
    <main className="page"><section className="section"><div className="container">
      <Link href="/search" className="muted" style={{ textDecoration: 'none' }}>← Back to houses</Link>
      <div className="two" style={{ marginTop: 14 }}>
        <div className="panel">
          <div className="rooms">
            {rooms.map(([name, src]) => (
              <div className="room" key={name}>
                {src ? <img src={src} alt={name} /> : <div style={{ background: '#eee', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13 }}>No photo yet</div>}
                <div className="rt">{name}</div>
              </div>
            ))}
          </div>
        </div>
        <aside className="panel">
          <span className="badge">{l.vacancy}</span>
          {l.isDemo && <span className="badge" style={{ marginLeft: 8, background: '#444' }}>DEMO LISTING</span>}
          <div className="price" style={{ fontSize: 28 }}>KSh {l.rent.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 700 }}>/ month</span></div>
          <h1 style={{ fontSize: 25, margin: '7px 0' }}>{l.houseType}</h1>
          <div className="muted">📍 {l.hood} · {l.area}</div>
          <div className="statgrid" style={{ marginTop: 16 }}>
            <div className="stat"><b>{l.water}</b><span className="muted">Water</span></div>
            <div className="stat"><b>{l.security}</b><span className="muted">Security</span></div>
            <div className="stat"><b>{l.road}</b><span className="muted">To road</span></div>
          </div>
          <div className="chips">
            <span className="chip">📶 {l.internet}</span>
            <span className="chip">🚗 Parking {l.parking}</span>
            <span className="chip">Fresh room captures</span>
          </div>
          <div className="notice" style={{ marginTop: 16 }}>
            👤 Listed by {l.contactName}{l.contactPhone ? ` · ${l.contactPhone}` : ''}<br />
            {l.isDemo ? 'This is demo data included to fill out the map — not a real listing.' : 'Every room photo here was captured live and passed an AI check confirming it actually shows a house.'}
          </div>
          {l.contactPhone && !l.isDemo ? (
            <a className="btn btn-primary" style={{ width: '100%', marginTop: 12, display: 'block', textAlign: 'center' }} href={`tel:${l.contactPhone.replace(/\s+/g, '')}`}>
              Call {l.contactName}
            </a>
          ) : (
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={l.isDemo}>
              {l.isDemo ? 'Demo listing — no contact' : 'Message tenant'}
            </button>
          )}
        </aside>
      </div>
    </div></section></main>
  )
}

