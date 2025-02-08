
export type MentalWellnessMeasurementUnit = 'minutes' | 'hours' | 'count';

export interface MentalWellnessActivity {
  id: number;
  user_id: string;
  activity_name: string;
  activity_type: string;
  measurement_unit: MentalWellnessMeasurementUnit;
  created_at: string;
  updated_at: string;
}

export interface MentalWellnessLog {
  id: number;
  activity_id: number;
  user_id: string;
  value: number;
  notes?: string;
  logged_at: string;
  created_at: string;
}
