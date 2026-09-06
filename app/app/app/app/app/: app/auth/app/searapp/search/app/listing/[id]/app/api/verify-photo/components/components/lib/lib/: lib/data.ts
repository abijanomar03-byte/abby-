ts
import { getSupabase } from './supabase'
import { listings as demoListings, findListing as findDemoListing } from './demo'
import { Listing, PropertyRow, PropertyMediaRow, ProfileRow, VacancyStatus } from './types'

const ROOM_KEYS = ['sittingRoom', 'bedroom', 'kitchen', 'washroom'] as const
const ROOM_TYPE_MAP: Record<string, typeof ROOM_KEYS[number]> = {
  'Sitting Room': 'sittingRoom', 'Bedroom': 'bedroom', 'Kitchen': 'kitchen', 'Washroom': 'washroom'
}

function publicUrlFor(path: string): string {
  const supabase = getSupabase()
  if (!supabase) return ''
  return supabase.storage.from('property-media').getPublicUrl(path).data.publicUrl
}

function vacancyLabelFromDate(dateStr: string): VacancyStatus {
  const days = Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (days <= 0) return 'Vacant now'
  if (days <= 5) return 'Vacant in 5 days'
  if (days <= 10) return 'Vacant in 10 days'
  if (days <= 15) return 'Vacant in 15 days'
  return 'Vacant in 30 days'
}

export function mapPropertyToListing(
  property: PropertyRow,
  media: PropertyMediaRow[],
  owner: ProfileRow | null
): Listing {
  const photos: Record<string, string> = {}
  for (const m of media) {
    if (m.media_type !== 'photo' || !m.room_type) continue
    const key = ROOM_TYPE_MAP[m.room_type]
    if (key) photos[key] = publicUrlFor(m.storage_path)
  }
  return {
    id: property.id,
    hood: property.hood,
    area: property.area,
    houseType: property.house_type,
    rent: property.rent,
    deposit: property.deposit ?? property.rent,
    vacancy: vacancyLabelFromDate(property.vacancy_date),
    water: property.water || '—',
    security: property.security || '—',
    road: property.road || '—',
    internet: property.internet || '—',
    parking: property.parking || '—',
    sittingRoom: photos.sittingRoom || '',
    bedroom: photos.bedroom || '',
    kitchen: photos.kitchen || '',
    washroom: photos.washroom || '',
    contactName: owner?.full_name || 'Landlord',
    contactPhone: owner?.phone || undefined,
    isDemo: false
  }
}

/** Real listings from Supabase. Returns [] if Supabase isn't configured or the query fails —
 *  callers decide whether/how to fall back to demo data, so this never silently pretends. */
export async function getRealListings(): Promise<Listing[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('properties')
    .select('*, property_media(*), owner:profiles(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((row: any) =>
    mapPropertyToListing(row as PropertyRow, (row.property_media || []) as PropertyMediaRow[], row.owner as ProfileRow | null)
  )
}

export async function getRealListingById(id: string): Promise<Listing | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('properties')
    .select('*, property_media(*), owner:profiles(*)')
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle()
  if (error || !data) return null
  return mapPropertyToListing(data as PropertyRow, (data.property_media || []) as PropertyMediaRow[], data.owner as ProfileRow | null)
}

/** Combined feed: real listings first, demo ones appended (clearly flagged
 *  isDemo) to fill the page while the real inventory is still small. Never
 *  mixes the two silently — every demo card carries isDemo:true so the UI
 *  can label it. */
export async function getListings(filters: { location?: string; type?: string; budget?: number }): Promise<Listing[]> {
  const real = await getRealListings()
  const demo = demoListings.map(l => ({ ...l, isDemo: true as const }))
  const all = [...real, ...demo]
  return all.filter(l =>
    (!filters.location || l.hood === filters.location) &&
    (!filters.type || l.houseType === filters.type) &&
    (!filters.budget || l.rent <= filters.budget)
  )
}

export async function getListingById(id: string): Promise<Listing | null> {
  const real = await getRealListingById(id)
  if (real) return real
  const demo = findDemoListing(id)
  return demo ? { ...demo, isDemo: true } : null
}
