/*
# Create Clínica Pediátrica Integral Schema

## Overview
Creates the full database schema for a pediatric clinic patient portal. Tutors (parents/guardians) register, add their children as patients, book appointments with pediatricians, make payments, and view medical records and prescriptions.

## New Tables

1. **profiles** — Extends auth.users with clinic-specific user data
   - id (uuid, FK to auth.users, PK)
   - email (text)
   - nombres (text)
   - apellidos (text)
   - ci_nit (text, unique identifier)
   - telefono (text)
   - role (text, default 'TUTOR')

2. **pacientes** — Children/dependents registered by tutors
   - id (uuid, PK)
   - tutor_id (uuid, FK to profiles, owner)
   - nombres (text)
   - apellidos (text)
   - fecha_nacimiento (date)
   - sexo (text: 'M' or 'F')
   - alergias (text, nullable)
   - grupo_sanguineo (text, nullable)

3. **medicos** — Pediatricians / doctors
   - id (uuid, PK)
   - nombres (text)
   - apellidos (text)
   - especialidad (text)
   - profile_id (uuid, FK to profiles, nullable)

4. **horarios_medicos** — Available time slots for each medic
   - id (uuid, PK)
   - medico_id (uuid, FK to medicos)
   - fecha (date)
   - hora_inicio (time)
   - hora_fin (time)
   - disponible (boolean, default true)

5. **citas** — Appointments
   - id (uuid, PK)
   - paciente_id (uuid, FK to pacientes)
   - tutor_id (uuid, FK to profiles, owner)
   - medico_id (uuid, FK to medicos)
   - horario_id (uuid, FK to horarios_medicos, nullable)
   - fecha_hora (timestamptz)
   - estado (text, default 'PENDIENTE')
   - motivo (text, nullable)

6. **pagos** — Payments for appointments
   - id (uuid, PK)
   - cita_id (uuid, FK to citas)
   - tutor_id (uuid, FK to profiles, owner)
   - monto (numeric)
   - metodo (text: 'QR' or 'EFECTIVO')
   - codigo_referencia_qr (text, nullable)
   - comprobante_url (text, nullable)
   - estado (text, default 'PENDIENTE')

7. **historias_clinicas** — Medical records / consultation notes
   - id (uuid, PK)
   - paciente_id (uuid, FK to pacientes)
   - medico_id (uuid, FK to medicos)
   - cita_id (uuid, FK to citas, nullable)
   - fecha (timestamptz, default now)
   - diagnostico (text)
   - peso (numeric, nullable)
   - altura (numeric, nullable)
   - temperatura (numeric, nullable)
   - indicaciones_tratamiento (text, nullable)

8. **recetas** — Prescriptions linked to medical records
   - id (uuid, PK)
   - historia_clinica_id (uuid, FK to historias_clinicas)
   - paciente_id (uuid, FK to pacientes)
   - medicamento (text)
   - dosis (text)
   - frecuencia (text)
   - duracion (text)
   - indicaciones_tratamiento (text, nullable)
   - fecha (timestamptz, default now)

9. **notificaciones** — Notification inbox for tutors
   - id (uuid, PK)
   - tutor_id (uuid, FK to profiles, owner)
   - tipo (text: 'PAGO', 'CITA', 'RECETA', 'GENERAL')
   - titulo (text)
   - mensaje (text)
   - leida (boolean, default false)
   - created_at (timestamptz, default now)

## Security
- RLS enabled on all tables.
- profiles: owner-scoped (users can CRUD their own profile row).
- pacientes, citas, pagos, notificaciones: owner-scoped via tutor_id = auth.uid().
- medicos, horarios_medicos: readable by all authenticated users (public reference data).
- historias_clinicas, recetas: readable by the tutor who owns the patient (via paciente_id -> tutor_id).
- All INSERT/UPDATE operations are owner-scoped.
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  nombres text NOT NULL,
  apellidos text NOT NULL,
  ci_nit text,
  telefono text,
  role text NOT NULL DEFAULT 'TUTOR',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- PACIENTES
CREATE TABLE IF NOT EXISTS pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  nombres text NOT NULL,
  apellidos text NOT NULL,
  fecha_nacimiento date NOT NULL,
  sexo text NOT NULL CHECK (sexo IN ('M', 'F')),
  alergias text,
  grupo_sanguineo text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_pacientes" ON pacientes;
CREATE POLICY "select_own_pacientes" ON pacientes FOR SELECT
  TO authenticated USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "insert_own_pacientes" ON pacientes;
CREATE POLICY "insert_own_pacientes" ON pacientes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "update_own_pacientes" ON pacientes;
CREATE POLICY "update_own_pacientes" ON pacientes FOR UPDATE
  TO authenticated USING (auth.uid() = tutor_id) WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "delete_own_pacientes" ON pacientes;
CREATE POLICY "delete_own_pacientes" ON pacientes FOR DELETE
  TO authenticated USING (auth.uid() = tutor_id);

-- MEDICOS
CREATE TABLE IF NOT EXISTS medicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres text NOT NULL,
  apellidos text NOT NULL,
  especialidad text NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_medicos" ON medicos;
CREATE POLICY "select_all_medicos" ON medicos FOR SELECT
  TO authenticated USING (true);

-- HORARIOS_MEDICOS
CREATE TABLE IF NOT EXISTS horarios_medicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id uuid NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  hora_inicio time NOT NULL,
  hora_fin time NOT NULL,
  disponible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE horarios_medicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_horarios" ON horarios_medicos;
CREATE POLICY "select_all_horarios" ON horarios_medicos FOR SELECT
  TO authenticated USING (true);

-- CITAS
CREATE TABLE IF NOT EXISTS citas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  tutor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  medico_id uuid NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  horario_id uuid REFERENCES horarios_medicos(id) ON DELETE SET NULL,
  fecha_hora timestamptz NOT NULL,
  estado text NOT NULL DEFAULT 'PENDIENTE',
  motivo text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_citas" ON citas;
CREATE POLICY "select_own_citas" ON citas FOR SELECT
  TO authenticated USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "insert_own_citas" ON citas;
CREATE POLICY "insert_own_citas" ON citas FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "update_own_citas" ON citas;
CREATE POLICY "update_own_citas" ON citas FOR UPDATE
  TO authenticated USING (auth.uid() = tutor_id) WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "delete_own_citas" ON citas;
CREATE POLICY "delete_own_citas" ON citas FOR DELETE
  TO authenticated USING (auth.uid() = tutor_id);

-- PAGOS
CREATE TABLE IF NOT EXISTS pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id uuid NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
  tutor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  monto numeric(10,2) NOT NULL DEFAULT 0,
  metodo text NOT NULL CHECK (metodo IN ('QR', 'EFECTIVO')),
  codigo_referencia_qr text,
  comprobante_url text,
  estado text NOT NULL DEFAULT 'PENDIENTE',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_pagos" ON pagos;
CREATE POLICY "select_own_pagos" ON pagos FOR SELECT
  TO authenticated USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "insert_own_pagos" ON pagos;
CREATE POLICY "insert_own_pagos" ON pagos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "update_own_pagos" ON pagos;
CREATE POLICY "update_own_pagos" ON pagos FOR UPDATE
  TO authenticated USING (auth.uid() = tutor_id) WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "delete_own_pagos" ON pagos;
CREATE POLICY "delete_own_pagos" ON pagos FOR DELETE
  TO authenticated USING (auth.uid() = tutor_id);

-- HISTORIAS_CLINICAS
CREATE TABLE IF NOT EXISTS historias_clinicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id uuid NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  cita_id uuid REFERENCES citas(id) ON DELETE SET NULL,
  fecha timestamptz DEFAULT now(),
  diagnostico text NOT NULL,
  peso numeric(5,2),
  altura numeric(5,2),
  temperatura numeric(4,1),
  indicaciones_tratamiento text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE historias_clinicas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_historias" ON historias_clinicas;
CREATE POLICY "select_own_historias" ON historias_clinicas FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM pacientes
      WHERE pacientes.id = historias_clinicas.paciente_id
      AND pacientes.tutor_id = auth.uid()
    )
  );

-- RECETAS
CREATE TABLE IF NOT EXISTS recetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  historia_clinica_id uuid NOT NULL REFERENCES historias_clinicas(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medicamento text NOT NULL,
  dosis text NOT NULL,
  frecuencia text NOT NULL,
  duracion text NOT NULL,
  indicaciones_tratamiento text,
  fecha timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_recetas" ON recetas;
CREATE POLICY "select_own_recetas" ON recetas FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM pacientes
      WHERE pacientes.id = recetas.paciente_id
      AND pacientes.tutor_id = auth.uid()
    )
  );

-- NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('PAGO', 'CITA', 'RECETA', 'GENERAL')),
  titulo text NOT NULL,
  mensaje text NOT NULL,
  leida boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notificaciones" ON notificaciones;
CREATE POLICY "select_own_notificaciones" ON notificaciones FOR SELECT
  TO authenticated USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "insert_own_notificaciones" ON notificaciones;
CREATE POLICY "insert_own_notificaciones" ON notificaciones FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "update_own_notificaciones" ON notificaciones;
CREATE POLICY "update_own_notificaciones" ON notificaciones FOR UPDATE
  TO authenticated USING (auth.uid() = tutor_id) WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "delete_own_notificaciones" ON notificaciones;
CREATE POLICY "delete_own_notificaciones" ON notificaciones FOR DELETE
  TO authenticated USING (auth.uid() = tutor_id);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_pacientes_tutor ON pacientes(tutor_id);
CREATE INDEX IF NOT EXISTS idx_citas_tutor ON citas(tutor_id);
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_tutor ON pagos(tutor_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cita ON pagos(cita_id);
CREATE INDEX IF NOT EXISTS idx_historias_paciente ON historias_clinicas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_recetas_paciente ON recetas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tutor ON notificaciones(tutor_id);
CREATE INDEX IF NOT EXISTS idx_horarios_medico ON horarios_medicos(medico_id, fecha);
