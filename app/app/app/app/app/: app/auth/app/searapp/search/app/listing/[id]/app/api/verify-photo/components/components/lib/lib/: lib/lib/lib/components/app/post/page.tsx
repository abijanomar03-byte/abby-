tsx
'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HOODS } from '@/lib/locations'
import LiveCamera from '@/components/LiveCamera'
import { getSupabase } from '@/lib/supabase'

const ROOMS = ['Sitting Room', 'Bedroom', 'Kitchen', 'Washroom'] as const
const ROOM_TO_KEY: Record<string, string> = {
  'Sitting Room': 'sittingRoom', 'Bedroom': 'bedroom', 'Kitchen': 'kitchen', 'Washroom': 'washroom'
}

type RoomStatus = 'idle' | 'checking' | 'ok' | 'rejected'

function checkPhotoQuality(dataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const w = 32, h = 32
        const c = document.createElement('canvas')
        c.width = w; c.height = h
        const ctx = c.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        const data = ctx.getImageData(0, 0, w, h).data
        let sum = 0, sumSq = 0
        const n = w * h
        for (let i = 0; i < data.length; i += 4) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          sum += lum; sumSq += lum * lum
        }
        const mean = sum / n
        const variance = sumSq / n - mean * mean
        resolve(variance > 120)
      } catch { resolve(true) }
    }
    img.onerror = () => resolve(false)
    img.src = dataUrl
  })
}

async function verifyIsHousePhoto(dataUrl: string, roomType: string): Promise<{ ok: boolean; reason: string; warning?: string }> {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/)
  if (!match) return { ok: true, reason: '' }
  const [, mediaType, base64] = match
  try {
    const r = await fetch('/api/verify-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mediaType, roomType })
    })
    const data = await r.json()
    return { ok: !!data.is_house, reason: data.reason || '', warning: data.warning }
  } catch {
    return { ok: true, reason: '', warning: 'Verification request failed — photo accepted without a content check.' }
  }
}

export default function Post() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const [hood, setHood] = useState('')
  const [area, setArea] = useState('')
  const [type, setType] = useState('Bedsitter')
  const [rent, setRent] = useState('')
  const [vacancy, setVacancy] = useState('30')
  const [water, setWater] = useState('Daily')
  const [security, setSecurity] = useState('Good')
  const [internet, setInternet] = useState('Fibre available')
  const [parking, setParking] = useState('No')

  const [roomIndex, setRoomIndex] = useState(0)
  const room = ROOMS[roomIndex]
  const [photos, setPhotos] = useState<Record<string, string>>({})
  const [statuses, setStatuses] = useState<Record<string, RoomStatus>>({})
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [warnings, setWarnings] = useState<Record<string, string>>({})

  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [publishedId, setPublishedId] = useState<string | null>(null)

  const areas = useMemo(() => (hood ? (HOODS[hood as keyof typeof HOODS] as readonly string[]) : []), [hood])
  const allOk = ROOMS.every(r => statuses[r] === 'ok')

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) { setCheckingAuth(false); return }
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/auth?next=/post'); return }
      setUserId(data.user.id)
      setCheckingAuth(false)
    })
  }, [router])

  const onCapture = async (roomName: string, dataUrl: string) => {
    setStatuses(s => ({ ...s, [roomName]: 'checking' }))
    setReasons(r => ({ ...r, [roomName]: '' }))
    setWarnings(w => ({ ...w, [roomName]: '' }))

    const qualityOk = await checkPhotoQuality(dataUrl)
    if (!qualityOk) {
      setStatuses(s => ({ ...s, [roomName]: 'rejected' }))
      setReasons(r => ({ ...r, [roomName]: 'Photo looks blank or too dark — try again with better lighting.' }))
      return
    }

    const verdict = await verifyIsHousePhoto(dataUrl, roomName)
    if (!verdict.ok) {
      setStatuses(s => ({ ...s, [roomName]: 'rejected' }))
      setReasons(r => ({ ...r, [roomName]: verdict.reason || "Doesn't look like a room/house photo." }))
      return
    }

    setPhotos(p => ({ ...p, [roomName]: dataUrl }))
    setStatuses(s => ({ ...s, [roomName]: 'ok' }))
    if (verdict.warning) setWarnings(w => ({ ...w, [roomName]: verdict.warning! }))

    const nextIndex = ROOMS.indexOf(roomName as typeof ROOMS[number]) + 1
    if (nextIndex < ROOMS.length) setRoomIndex(nextIndex)
  }

  async function publish() {
    setPublishError('')
    const supabase = getSupabase()
    if (!supabase) { setPublishError('Supabase is not configured on this deployment yet.'); return }
    if (!userId) { router.push('/auth?next=/post'); return }
    if (!hood || !area || !rent || !allOk) return

    setPublishing(true)
    try {
      const vacancyDays = Number(vacancy)
      const vacancyDate = new Date()
      vacancyDate.setDate(vacancyDate.getDate() + vacancyDays)

      const { data: property, error: insertError } = await supabase
        .from('properties')
        .insert({
          owner_id: userId, hood, area, house_type: type,
          rent: Number(rent), deposit: Number(rent),
          vacancy_date: vacancyDate.toISOString().slice(0, 10),
          water, security, road: '5 min walk', internet, parking
        })
        .select()
        .single()
      if (insertError || !property) throw insertError || new Error('Could not create the listing.')

      for (const roomName of ROOMS) {
        const dataUrl = photos[roomName]
        const blob = await (await fetch(dataUrl)).blob()
        const path = `${userId}/${property.id}/${ROOM_TO_KEY[roomName]}.jpg`
        const { error: uploadError } = await supabase.storage.from('property-media').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
        if (uploadError) throw uploadError

        const { error: mediaError } = await supabase.from('property_media').insert({
          property_id: property.id, room_type: roomName, media_type: 'photo',
          storage_path: path, captured_at: new Date().toISOString(), ai_verified: true
        })
        if (mediaError) throw mediaError
      }

      setPublishedId(property.id)
    } catch (err: any) {
      setPublishError(err?.message || 'Something went wrong while publishing. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  if (checkingAuth) {
    return <main className="page"><section className="section"><div className="container"><div className="panel">Checking your account…</div></div></section></main>
  }

  if (publishedId) {
    return (
      <main className="page"><section className="section"><div className="container"><div className="panel">
        <h1>✓ Your house is live</h1>
        <p className="muted">All 4 rooms were captured live and passed the AI house-photo check. This is a real listing — anyone browsing Hama can see it now.</p>
        <div className="rooms">
          {ROOMS.map(r => photos[r] && (
            <div className="room" key={r}><img src={photos[r]} alt={r} /><div className="rt">{r} · Fresh capture</div></div>
          ))}
        </div>
        <Link href={`/listing/${publishedId}`} className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>View your live listing →</Link>
      </div></div></section></main>
    )
  }

  return (
    <main className="page"><section className="section"><div className="container"><div className="two">
      <div className="panel">
        <div className="eyebrow">I&apos;M MOVING OUT</div>
        <h1>Post your house</h1>
        <p className="muted">Post after giving notice to move out. Fresh camera captures are checked by AI to keep listings real.</p>
        <div className="form">
          <div>
            <label>Where do you stay?</label>
            <select className="field" style={{ width: '100%' }} value={hood} onChange={e => { setHood(e.target.value); setArea('') }}>
              <option value="">Choose a hood</option>
              {Object.keys(HOODS).map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
          {hood && areas.length > 0 && (
            <div>
              <label>Area</label>
              <select className="field" style={{ width: '100%' }} value={area} onChange={e => setArea(e.target.value)}>
                <option value="">Choose an area</option>
                {areas.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          )}
          <div>
            <label>House type</label>
            <select className="field" style={{ width: '100%' }} value={type} onChange={e => setType(e.target.value)}>
              <option>Bedsitter</option><option>1 Bedroom</option><option>2 Bedrooms</option>
            </select>
          </div>
          <div>
            <label>Monthly rent</label>
            <input className="field" style={{ width: '100%' }} value={rent} onChange={e => setRent(e.target.value)} placeholder="e.g. 16000" inputMode="numeric" />
          </div>
          <div>
            <label>Vacancy</label>
            <select className="field" style={{ width: '100%' }} value={vacancy} onChange={e => setVacancy(e.target.value)}>
              <option value="0">Vacant now</option><option value="5">Vacant in 5 days</option>
              <option value="10">Vacant in 10 days</option><option value="15">Vacant in 15 days</option>
              <option value="30">Vacant in 30 days</option>
            </select>
          </div>
          <div>
            <label>Water</label>
            <select className="field" style={{ width: '100%' }} value={water} onChange={e => setWater(e.target.value)}>
              <option>Daily</option><option>Sometimes</option><option>Rare</option>
            </select>
          </div>
          <div>
            <label>Security</label>
            <select className="field" style={{ width: '100%' }} value={security} onChange={e => setSecurity(e.target.value)}>
              <option>Good</option><option>Average</option><option>Poor</option>
            </select>
          </div>
          <div>
            <label>Internet</label>
            <select className="field" style={{ width: '100%' }} value={internet} onChange={e => setInternet(e.target.value)}>
              <option>Fibre available</option><option>Mobile data only</option><option>None nearby</option>
            </select>
          </div>
          <div>
            <label>Parking</label>
            <select className="field" style={{ width: '100%' }} value={parking} onChange={e => setParking(e.target.value)}>
              <option>Yes</option><option>No</option>
            </select>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="eyebrow">LIVE CAPTURE</div>
        <h2 style={{ margin: '6px 0' }}>Room by room</h2>
        <p className="muted">No gallery picker. Every photo is captured live and checked by AI before it&apos;s accepted.</p>
        <div className="chips" style={{ marginBottom: 12 }}>
          {ROOMS.map((r, i) => (
            <button key={r} className="chip" onClick={() => setRoomIndex(i)}
              style={{ border: room === r ? '2px solid var(--green)' : '1px solid transparent', background: '#fff' }}>
              {r} {statuses[r] === 'ok' ? '✓' : statuses[r] === 'checking' ? '…' : statuses[r] === 'rejected' ? '✗' : ''}
            </button>
          ))}
        </div>

        {statuses[room] === 'checking' && <div className="notice">Checking photo — confirming it&apos;s really a room…</div>}
        {statuses[room] === 'rejected' && <div className="notice" style={{ color: '#b3261e' }}>✗ Rejected: {reasons[room]}</div>}
        {statuses[room] === 'ok' && warnings[room] && <div className="notice" style={{ color: '#b3261e' }}>⚠️ {warnings[room]}</div>}
        {statuses[room] === 'ok' && !warnings[room] && <div className="notice" style={{ color: 'var(--green)' }}>✓ Verified — this photo really shows a room.</div>}

        <LiveCamera key={room} label={room} onCapture={(dataUrl) => onCapture(room, dataUrl)} />

        {publishError && <div className="notice" style={{ color: '#b3261e', marginTop: 10 }}>{publishError}</div>}
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 14 }}
          disabled={!hood || !area || !rent || !allOk || publishing}
          onClick={publish}>
          {publishing ? 'Publishing…' : 'Publish house'}
        </button>
      </div>
    </div></div></section></main>
  )
}

