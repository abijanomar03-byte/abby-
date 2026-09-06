tsx
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import ListingCard from '@/components/ListingCard'
import { getListings } from '@/lib/data'

export default async function Home() {
  const all = await getListings({})
  const featured = all.slice(0, 8)
  const realCount = all.filter(l => !l.isDemo).length

  return (
    <main className="page">
      <section className="hero"><div className="container">
        <div className="eyebrow" style={{ opacity: .75 }}>TENANT-POWERED HOUSE HUNTING</div>
        <h1>Find a home from people who actually lived there.</h1>
        <p>Real room photos, rent, water, security, road access and vacancy timing — shared by tenants who are moving out.</p>
        <SearchBar />
      </div></section>
      <section className="section"><div className="container">
        <div className="section-head">
          <div>
            <h2>Houses currently available</h2>
            <div className="muted">{realCount > 0 ? `${realCount} real listing${realCount === 1 ? '' : 's'}, plus demo houses filling out the map` : 'Demo houses — be the first to post a real one'}</div>
          </div>
          <Link href="/search" className="btn btn-secondary">View all</Link>
        </div>
        <div className="grid">{featured.map(l => <ListingCard key={l.id} l={l} />)}</div>
      </div></section>
      <section className="section" style={{ paddingTop: 8 }}><div className="container"><div className="panel">
        <div className="two">
          <div>
            <div className="eyebrow">HOW HAMA WORKS</div>
            <h2 style={{ margin: '7px 0 10px' }}>Moving out? Help the next person.</h2>
            <p className="muted">After you give notice, capture your current home using Hama&apos;s live camera, add the living details, and publish your vacancy. Posting unlocks the wider marketplace.</p>
            <Link href="/post" className="btn btn-primary">I&apos;m moving out →</Link>
          </div>
          <div><div className="notice"><b>Fresh by design.</b><br />Every real listing&apos;s photos are captured live and checked by AI to confirm they actually show a house — no gallery uploads, no recycled photos.</div></div>
        </div>
      </div></div></section>
      <footer className="footer"><div className="container">Hama MVP · {all.length.toLocaleString()} listings ({realCount} real, {all.length - realCount} demo).</div></footer>
    </main>
  )
}

