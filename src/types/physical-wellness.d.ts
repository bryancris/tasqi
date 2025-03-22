
export type MeasurementUnit = 'count' | 'minutes' | 'hours' | 'meters' | 'kilometers' | 'pounds' | 'kilograms' | 'milliliters' | 'liters' | 'percentage';

export interface PhysicalWellnessActivity {
  id: number;
  user_id: string;
  activity_name: string;
  activity_type: string;
  measurement_unit: MeasurementUnit;
  created_at: string;
  updated_at: string;
}

export interface PhysicalWellnessLog {
  id: number;
  activity_id: number;
  user_id: string;
  value: number;
  notes?: string;
  logged_at: string;
  created_at: string;
}
