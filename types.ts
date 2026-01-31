
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
  GREEN = 'Green',
  YELLOW = 'Yellow',
  RED = 'Red'
}

export enum UserStatus {
  ATIVO = 'Active',
  INATIVO = 'Inactive'
}

export interface Student {
  id: string;
  academy_id: string;
  name: string;
  full_name?: string; // For backward compatibility with existing usage
  full_name_normalized?: string; // Normalized version for UNIQUE constraint
  email: string;
  phone: string;
  phone_e164?: string; // E.164 normalized phone (primary operational identifier)
  belt_level: Belt;
  degrees: number;
  status: UserStatus;
  flag: 'GREEN' | 'YELLOW' | 'RED'; // Stored as English strings in DB
  last_attendance: string | null;
  card_pass_code: string;
  internal_id?: number | string;
  photo_url?: string;
  birth_date: string;
  notes?: string;
  contact_history: ContactLog[];
  // Password reset fields
  must_change_password?: boolean; // Flag set when admin resets password to temporary
  temp_password_expires_at?: string | null; // Expiration timestamp for temporary password
  password?: string; // Plain text stored (backward compatibility - should migrate to Supabase Auth)
  // Soft delete
  created_at?: string;
  archived_at?: string | null; // Timestamp when student was inactivated/archived
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

export interface PasswordResetAudit {
  id: string;
  academy_id: string;
  student_id: string;
  admin_id: string; // Email of admin who reset
  reset_at: string;
  method: 'desk_reset'; // Reserved for future reset methods
}
