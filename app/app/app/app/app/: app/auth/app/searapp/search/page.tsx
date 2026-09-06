tsx
import ListingCard from '@/components/ListingCard'
import { HOODS } from '@/lib/locations'
import { getListings } from '@/lib/data'

export default async function Search({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams
  const location = q.location || ''
  const type = q.type || ''
  const budget = Number(q.budget || 0)
  const results = await getListings({ location, type, budget })

  return (
    <main className="page"><section className="section"><div className="container">
      <div className="section-head"><div>
        <div className="eyebrow">HAMA SEARCH</div>
        <h2>{results.length.toLocaleString()} houses</h2>
        <div className="muted">Use the filters to narrow by hood, house type and budget.</div>
      </div></div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <form className="searchbar" style={{ boxShadow: 'none', marginTop: 0, padding: 0 }}>
          <select name="location" className="field" defaultValue={location}>
            <option value="">All locations</option>
            {Object.keys(HOODS).map(h => <option key={h}>{h}</option>)}
          </select>
          <select name="type" className="field" defaultValue={type}>
            <option value="">All types</option>
            <option>Bedsitter</option><option>1 Bedroom</option><option>2 Bedrooms</option>
          </select>
          <input name="budget" className="field" defaultValue={budget || ''} placeholder="Max rent" />
          <button className="btn btn-primary">Filter</button>
        </form>
      </div>

      <div className="grid">{results.slice(0, 60).map(l => <ListingCard key={l.id} l={l} />)}</div>
    </div></section></main>
  )
}

