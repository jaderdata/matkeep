
export enum Belt {
  BRANCA = 'White',
  CINZA_BRANCA = 'Gray and White',
  CINZA = 'Gray',
  CINZA_PRETA = 'Gray and Black',
  AMARELA_BRANCA = 'Yellow and White',
  AMARELA = 'Yellow',
  AMARELA_PRETA = 'Yellow and Black',
  LARANJA_BRANCA = 'Orange and White',
  LARANJA = 'Orange',
  LARANJA_PRETA = 'Orange and Black',
  VERDE_BRANCA = 'Green and White',
  VERDE = 'Green',
  VERDE_PRETA = 'Green and Black',
  AZUL = 'Blue',
  ROXA = 'Purple',
  MARROM = 'Brown',
  PRETA = 'Black',
  VERMELHA_PRETA = 'Red and Black (7th Degree)',
  VERMELHA_BRANCA = 'Red and White (8th Degree)',
  VERMELHA = 'Red (9th and 10th Degrees)'
}

export enum FlagStatus {
  VERDE = 'Green',
  AMARELA = 'Yellow',
  VERMELHA = 'Red'
}

export enum UserStatus {
  ATIVO = 'Active',
  INATIVO = 'Inactive'
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  belt: Belt;
  degrees: number;
  status: UserStatus;
  flag: FlagStatus;
  last_attendance: string | null;
  card_pass_code: string;
  internal_id?: number | string;
  photo_url?: string;
  birth_date: string;
  notes?: string;
  contact_history: ContactLog[];
}

export interface ContactLog {
  date: string;
  channel: 'WhatsApp' | 'SMS' | 'Ligação' | 'Presencial';
  observation?: string;
}

export interface Academy {
  id: string;
  name: string;
  address: string;
  contact: string;
  logoUrl?: string;
  slug?: string;
  subscription_plan?: 'trial' | 'definitive';
  trial_start_date?: string;
  trial_end_date?: string;
  settings: {
    yellowFlagDays: number;
    redFlagDays: number;
  };
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  timestamp: string;
  academyId: string;
}
