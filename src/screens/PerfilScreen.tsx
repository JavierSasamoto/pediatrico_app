import { useEffect, useState, useCallback } from 'react';
import { supabase, type Profile, type Paciente } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { SkeletonList, EmptyState } from '@/components/ui/Skeleton';
import {
  Plus,
  Baby,
  LogOut,
  Phone,
  Mail,
  IdCard,
  Cake,
  Droplet,
  AlertCircle,
  X,
  Loader2,
  Trash2,
  Pencil,
} from 'lucide-react';

const bloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export function PerfilScreen() {
  const { profile, signOut } = useAuth();
  const { showToast } = useToast();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);

  const fetchPacientes = useCallback(async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('tutor_id', profile.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPacientes(data as Paciente[]);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pacientes').delete().eq('id', id);
    if (error) {
      showToast('Error al eliminar', 'error');
    } else {
      showToast('Dependiente eliminado', 'success');
      fetchPacientes();
    }
  };

  const calculateAge = (fechaNacimiento: string) => {
    const birth = new Date(fechaNacimiento);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <div className="pb-24 min-h-screen bg-slate-50">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-500 px-5 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-xl font-bold">
            {profile?.nombres?.[0]?.toUpperCase() || '?'}
            {profile?.apellidos?.[0]?.toUpperCase() || ''}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">
              {profile?.nombres} {profile?.apellidos}
            </h1>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-white/20 text-teal-50 text-xs font-medium">
              Tutor
            </span>
          </div>
          <button
            onClick={signOut}
            className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md text-white hover:bg-white/25 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {profile?.email && (
            <div className="flex items-center gap-2 text-teal-50 text-sm">
              <Mail className="w-4 h-4" /> {profile.email}
            </div>
          )}
          {profile?.telefono && (
            <div className="flex items-center gap-2 text-teal-50 text-sm">
              <Phone className="w-4 h-4" /> {profile.telefono}
            </div>
          )}
          {profile?.ci_nit && (
            <div className="flex items-center gap-2 text-teal-50 text-sm">
              <IdCard className="w-4 h-4" /> {profile.ci_nit}
            </div>
          )}
        </div>
      </div>

      {/* Dependents Section */}
      <div className="px-5 -mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800">Mis Dependientes</h2>
          <button
            onClick={() => {
              setEditingPaciente(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {loading ? (
          <SkeletonList count={2} />
        ) : pacientes.length === 0 ? (
          <EmptyState
            icon={<Baby className="w-8 h-8" />}
            title="Sin dependientes registrados"
            subtitle="Agrega a tus hijos para gestionar sus citas y historial clínico"
          />
        ) : (
          <div className="space-y-3">
            {pacientes.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-fade-in"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      p.sexo === 'M'
                        ? 'bg-sky-100 text-sky-600'
                        : 'bg-pink-100 text-pink-600'
                    }`}
                  >
                    <Baby className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 text-sm">
                      {p.nombres} {p.apellidos}
                    </h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Cake className="w-3 h-3" /> {calculateAge(p.fecha_nacimiento)} años
                      </span>
                      <span className="flex items-center gap-1">
                        <Droplet className="w-3 h-3" /> {p.grupo_sanguineo || 'N/A'}
                      </span>
                    </div>
                    {p.alergias && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-amber-600">
                        <AlertCircle className="w-3 h-3" /> {p.alergias}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingPaciente(p);
                        setShowForm(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && profile && (
        <PacienteForm
          profile={profile}
          editing={editingPaciente}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchPacientes();
          }}
        />
      )}
    </div>
  );
}

function PacienteForm({
  profile,
  editing,
  onClose,
  onSaved,
}: {
  profile: Profile;
  editing: Paciente | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombres: editing?.nombres || '',
    apellidos: editing?.apellidos || '',
    fecha_nacimiento: editing?.fecha_nacimiento || '',
    sexo: editing?.sexo || 'M',
    alergias: editing?.alergias || '',
    grupo_sanguineo: editing?.grupo_sanguineo || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        tutor_id: profile.id,
        nombres: form.nombres,
        apellidos: form.apellidos,
        fecha_nacimiento: form.fecha_nacimiento,
        sexo: form.sexo as 'M' | 'F',
        alergias: form.alergias || null,
        grupo_sanguineo: form.grupo_sanguineo || null,
      };

      if (editing) {
        const { error } = await supabase
          .from('pacientes')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        showToast('Dependiente actualizado', 'success');
      } else {
        const { error } = await supabase.from('pacientes').insert(payload);
        if (error) throw error;
        showToast('Dependiente registrado', 'success');
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto no-scrollbar animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800">
            {editing ? 'Editar Dependiente' : 'Nuevo Dependiente'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nombres" required>
              <input
                value={form.nombres}
                onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                required
                className="form-input"
              />
            </FormField>
            <FormField label="Apellidos" required>
              <input
                value={form.apellidos}
                onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                required
                className="form-input"
              />
            </FormField>
          </div>

          <FormField label="Fecha de Nacimiento" required>
            <input
              type="date"
              value={form.fecha_nacimiento}
              onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
              required
              className="form-input"
            />
          </FormField>

          <FormField label="Sexo" required>
            <div className="flex gap-2">
              {(['M', 'F'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, sexo: s })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    form.sexo === s
                      ? s === 'M'
                        ? 'bg-sky-100 text-sky-700 border-2 border-sky-400'
                        : 'bg-pink-100 text-pink-700 border-2 border-pink-400'
                      : 'bg-slate-50 text-slate-500 border-2 border-transparent'
                  }`}
                >
                  {s === 'M' ? 'Masculino' : 'Femenino'}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Grupo Sanguíneo">
            <select
              value={form.grupo_sanguineo}
              onChange={(e) => setForm({ ...form, grupo_sanguineo: e.target.value })}
              className="form-input"
            >
              <option value="">Seleccionar...</option>
              {bloodGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Alergias Conocidas">
            <input
              value={form.alergias}
              onChange={(e) => setForm({ ...form, alergias: e.target.value })}
              placeholder="Ej: Penicilina, maní..."
              className="form-input"
            />
          </FormField>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {editing ? 'Guardar Cambios' : 'Registrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}
