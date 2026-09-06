ts
import { HOODS } from './locations'
import { Listing, HouseType } from './types'

const photos=[
  'https://images.pexels.com/photos/5825398/pexels-photo-5825398.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/19836795/pexels-photo-19836795.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/6487949/pexels-photo-6487949.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/5998120/pexels-photo-5998120.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/6438748/pexels-photo-6438748.jpeg?auto=compress&cs=tinysrgb&w=900',
]
const types:HouseType[]=['Bedsitter','Bedsitter','1 Bedroom','1 Bedroom','2 Bedrooms']
const names=['Wanjiru M.','Otieno K.','Amina S.','Brian O.','Fatuma A.','David N.']
const rents=[9000,11000,14500,16500,22000]
const vacancies=['Vacant now','Vacant in 5 days','Vacant in 10 days','Vacant in 15 days','Vacant in 30 days'] as const
export const listings:Listing[] = Object.entries(HOODS).flatMap(([hood,areas])=>{
  const usable=areas.length?areas:['Main area']
  return usable.flatMap((area,ai)=>types.map((houseType,i)=>({
    id:`${hood}-${area}-${i}`.replace(/\s+/g,'-').toLowerCase(),hood,area,houseType,
    rent:rents[i],deposit:rents[i],vacancy:vacancies[(ai+i)%vacancies.length],
    water:i===1?'Sometimes':'Daily',security:i===0?'Average':'Good',road:`${3+i} min walk`,internet:'Fibre available',parking:i>2?'Yes':'No',
    sittingRoom:photos[(i+ai)%photos.length],bedroom:photos[(i+ai+1)%photos.length],kitchen:photos[(i+ai+2)%photos.length],washroom:photos[(i+ai+3)%photos.length],
    contactName:names[(i+ai)%names.length]
  })))
})

export const featured=listings.slice(0,8)
export function findListing(id:string){return listings.find(l=>l.id===id)}

