
export interface EmotionalLog {
  id: number;
  emotion: string;
  intensity: number;
  notes: string | null;
  coping_strategy: string | null;
  date_logged: string;
}

export interface EmotionalLogFormData {
  emotion: string;
  intensity: string;
  notes: string;
  coping_strategy: string;
}
