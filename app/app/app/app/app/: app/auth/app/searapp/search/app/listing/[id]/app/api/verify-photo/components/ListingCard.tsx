tsx
import Link from 'next/link'
import { Listing } from '@/lib/types'

export default function ListingCard({ l }: { l: Listing }) {
  return (
    <Link href={`/listing/${encodeURIComponent(l.id)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article className="card">
        <div style={{ position: 'relative' }}>
          <img className="thumb" src={l.sittingRoom} alt="Sitting room" />
          {l.isDemo && (
            <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
              DEMO
            </span>
          )}
        </div>
        <div className="cardbody">
          <span className="badge">{l.vacancy}</span>
          <div className="price">KSh {l.rent.toLocaleString()}/month</div>
          <div className="title">{l.houseType} · {l.hood}</div>
          <div className="meta">{l.area} · Water {l.water} · {l.road} to road</div>
          <div className="chips">
            <span className="chip">🛡️ {l.security}</span>
            <span className="chip">💧 {l.water}</span>
            <span className="chip">📶 {l.internet}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

