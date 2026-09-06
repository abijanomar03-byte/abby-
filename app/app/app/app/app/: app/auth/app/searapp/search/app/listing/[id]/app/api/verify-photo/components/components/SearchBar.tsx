tsx
'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {HOODS} from '@/lib/locations'
export default function SearchBar(){
 const [location,setLocation]=useState('');const [type,setType]=useState('');const [budget,setBudget]=useState('');const router=useRouter()
 const go=()=>{const p=new URLSearchParams();if(location)p.set('location',location);if(type)p.set('type',type);if(budget)p.set('budget',budget);router.push('/search?'+p.toString())}
 return <div className="searchbar"><select className="field" value={location} onChange={e=>setLocation(e.target.value)}><option value="">Where do you want to live?</option>{Object.keys(HOODS).map(h=><option key={h}>{h}</option>)}</select><select className="field" value={type} onChange={e=>setType(e.target.value)}><option value="">House type</option><option>Bedsitter</option><option>1 Bedroom</option><option>2 Bedrooms</option></select><input className="field" placeholder="Max rent e.g. 18000" value={budget} onChange={e=>setBudget(e.target.value)}/><button className="btn btn-primary" onClick={go}>Search</button></div>
}

