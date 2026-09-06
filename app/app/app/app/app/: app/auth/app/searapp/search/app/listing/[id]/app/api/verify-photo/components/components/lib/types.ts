ts
export type HouseType='Bedsitter'|'1 Bedroom'|'2 Bedrooms'|'3 Bedrooms'
export type VacancyStatus='Vacant now'|'Vacant in 5 days'|'Vacant in 10 days'|'Vacant in 15 days'|'Vacant in 30 days'
export type Listing={
  id:string;hood:string;area:string;houseType:HouseType;rent:number;deposit:number;vacancy:VacancyStatus;
  water:string;security:string;road:string;internet:string;parking:string;
  sittingRoom:string;bedroom:string;kitchen:string;washroom:string;
  contactName:string;contactPhone?:string;
  isDemo?:boolean; // true for seed/placeholder listings, false/undefined for real posted ones
}

// ---- Real database row shapes (mirrors supabase/schema.sql) ----
export type PropertyRow = {
  id:string; owner_id:string|null; hood:string; area:string; house_type:HouseType;
  rent:number; deposit:number|null; vacancy_date:string;
  water:string|null; security:string|null; road:string|null; internet:string|null; parking:string|null;
  created_at:string; status:string;
}
export type PropertyMediaRow = {
  id:string; property_id:string; room_type:string|null; media_type:'photo'|'video';
  storage_path:string; captured_at:string|null; latitude:number|null; longitude:number|null;
  ai_verified:boolean; created_at:string;
}
export type ProfileRow = { id:string; full_name:string|null; phone:string|null; created_at:string }

