export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  created_at?: string;
}

export interface Medication {
  id: string;
  name: string;
  generic_name: string;
  common_shortage: boolean;
  created_at?: string;
}

export interface Report {
  id: string;
  pharmacy_id: string;
  medication_id: string;
  status: 'in_stock' | 'out_of_stock';
  user_hash: string;
  confidence: number;
  created_at: string;
  pharmacy?: Pharmacy;
  medication?: Medication;
}

export interface PharmacyWithStatus extends Pharmacy {
  latest_report?: Report;
  status?: 'in_stock' | 'out_of_stock' | 'unknown';
  confidence?: number;
  last_updated?: string;
}

export type UserLocation = {
  latitude: number;
  longitude: number;
};