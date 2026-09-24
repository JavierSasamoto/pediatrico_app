import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  email: string | null;
  nombres: string;
  apellidos: string;
  ci_nit: string | null;
  telefono: string | null;
  role: string;
  created_at: string;
};

export type Paciente = {
  id: string;
  tutor_id: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo: 'M' | 'F';
  alergias: string | null;
  grupo_sanguineo: string | null;
  created_at: string;
};

export type Medico = {
  id: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  profile_id: string | null;
};

export type HorarioMedico = {
  id: string;
  medico_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
};

export type Cita = {
  id: string;
  paciente_id: string;
  tutor_id: string;
  medico_id: string;
  horario_id: string | null;
  fecha_hora: string;
  estado: string;
  motivo: string | null;
  created_at: string;
};

export type Pago = {
  id: string;
  cita_id: string;
  tutor_id: string;
  monto: number;
  metodo: 'QR' | 'EFECTIVO';
  codigo_referencia_qr: string | null;
  comprobante_url: string | null;
  estado: string;
  created_at: string;
};

export type HistoriaClinica = {
  id: string;
  paciente_id: string;
  medico_id: string;
  cita_id: string | null;
  fecha: string;
  diagnostico: string;
  peso: number | null;
  altura: number | null;
  temperatura: number | null;
  indicaciones_tratamiento: string | null;
};

export type Receta = {
  id: string;
  historia_clinica_id: string;
  paciente_id: string;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  indicaciones_tratamiento: string | null;
  fecha: string;
};

export type Notificacion = {
  id: string;
  tutor_id: string;
  tipo: 'PAGO' | 'CITA' | 'RECETA' | 'GENERAL';
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
};
