import { useEffect, useState, useCallback } from 'react';
import { supabase, type Paciente, type Medico, type HorarioMedico, type Cita } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { SkeletonList, EmptyState } from '@/components/ui/Skeleton';
import {
  Calendar,
  Plus,
  ChevronRight,
  ChevronLeft,
  Baby,
  Stethoscope,
  Clock,
  QrCode,
  Banknote,
  Check,
  Loader2,
  X,
  Upload,
  CheckCircle2,
  CalendarDays,
  User as UserIcon,
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

export function CitasScreen() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile) return;

    const [pacientesRes, medicosRes, citasRes] = await Promise.all([
      supabase.from('pacientes').select('*').eq('tutor_id', profile.id),
      supabase.from('medicos').select('*'),
      supabase
        .from('citas')
        .select('*, medicos:nombres, medicos:apellidos, medicos:especialidad')
        .eq('tutor_id', profile.id)
        .order('fecha_hora', { ascending: false }),
    ]);

    if (pacientesRes.data) setPacientes(pacientesRes.data as Paciente[]);
    if (medicosRes.data) setMedicos(medicosRes.data as Medico[]);
    if (citasRes.data) setCitas(citasRes.data as unknown as Cita[]);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreated = () => {
    setShowWizard(false);
    fetchData();
  };

  const estadoColors: Record<string, string> = {
    PENDIENTE: 'bg-amber-100 text-amber-700',
    CONFIRMADA: 'bg-teal-100 text-teal-700',
    CANCELADA: 'bg-rose-100 text-rose-700',
    COMPLETADA: 'bg-sky-100 text-sky-700',
  };

  return (
    <div className="pb-24 min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-teal-600 to-teal-500 px-5 pt-12 pb-6">
        <h1 className="text-xl font-bold text-white">Citas Médicas</h1>
        <p className="text-teal-50 text-sm mt-1">Agenda y gestiona tus citas</p>
      </div>

      <div className="px-5 -mt-4">
        <button
          onClick={() => setShowWizard(true)}
          disabled={pacientes.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 active:scale-[0.98] transition-all disabled:opacity-50 mb-4 shadow-md"
        >
          <Plus className="w-4 h-4" /> Agendar Nueva Cita
        </button>

        {pacientes.length === 0 && !loading && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 mb-4">
            Debes registrar al menos un dependiente antes de agendar una cita.
          </div>
        )}

        <h2 className="text-base font-bold text-slate-800 mb-3">Mis Citas</h2>

        {loading ? (
          <SkeletonList count={3} />
        ) : citas.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-8 h-8" />}
            title="No tienes citas agendadas"
            subtitle="Agenda tu primera cita médica para tu hijo o dependiente"
          />
        ) : (
          <div className="space-y-3">
            {citas.map((cita) => {
              const medico = medicos.find((m) => m.id === cita.medico_id);
              const paciente = pacientes.find((p) => p.id === cita.paciente_id);
              const fecha = new Date(cita.fecha_hora);
              return (
                <div
                  key={cita.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-fade-in"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">
                          Dr(a). {medico?.nombres} {medico?.apellidos}
                        </h3>
                        <p className="text-xs text-slate-500">{medico?.especialidad}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        estadoColors[cita.estado] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {cita.estado}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pl-1">
                    <span className="flex items-center gap-1">
                      <Baby className="w-3 h-3" /> {paciente?.nombres} {paciente?.apellidos}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {fecha.toLocaleDateString('es-BO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {fecha.toLocaleTimeString('es-BO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showWizard && profile && (
        <AppointmentWizard
          pacientes={pacientes}
          medicos={medicos}
          profileId={profile.id}
          onClose={() => setShowWizard(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

function AppointmentWizard({
  pacientes,
  medicos,
  profileId,
  onClose,
  onCreated,
}: {
  pacientes: Paciente[];
  medicos: Medico[];
  profileId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);
  const [horarios, setHorarios] = useState<HorarioMedico[]>([]);
  const [selectedHorario, setSelectedHorario] = useState<HorarioMedico | null>(null);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'QR' | 'EFECTIVO' | null>(null);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    if (step === 3 && paymentMethod === 'QR' && !qrCode) {
      setQrCode(`CPI-${Date.now().toString(36).toUpperCase()}`);
    }
  }, [step, paymentMethod, qrCode]);

  useEffect(() => {
    if (selectedMedico) {
      setLoadingHorarios(true);
      supabase
        .from('horarios_medicos')
        .select('*')
        .eq('medico_id', selectedMedico.id)
        .eq('disponible', true)
        .gte('fecha', new Date().toISOString().split('T')[0])
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true })
        .then(({ data, error }) => {
          if (!error && data) setHorarios(data as HorarioMedico[]);
          setLoadingHorarios(false);
        });
    }
  }, [selectedMedico]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setComprobanteFile(file);
  };

  const handleCreate = async () => {
    if (!selectedPaciente || !selectedMedico || !selectedHorario || !paymentMethod) return;

    setCreating(true);
    try {
      const fechaHora = new Date(`${selectedHorario.fecha}T${selectedHorario.hora_inicio}`);
      let comprobanteUrl: string | null = null;

      if (paymentMethod === 'QR' && comprobanteFile) {
        const ext = comprobanteFile.name.split('.').pop();
        const fileName = `comprobantes/${profileId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('comprobantes')
          .upload(fileName, comprobanteFile);
        if (!uploadError) {
          const { data } = supabase.storage.from('comprobantes').getPublicUrl(fileName);
          comprobanteUrl = data.publicUrl;
        }
      }

      const { data: citaData, error: citaError } = await supabase
        .from('citas')
        .insert({
          paciente_id: selectedPaciente.id,
          tutor_id: profileId,
          medico_id: selectedMedico.id,
          horario_id: selectedHorario.id,
          fecha_hora: fechaHora.toISOString(),
          estado: 'PENDIENTE',
        })
        .select()
        .single();

      if (citaError) throw citaError;

      const { error: pagoError } = await supabase.from('pagos').insert({
        cita_id: citaData.id,
        tutor_id: profileId,
        monto: 150,
        metodo: paymentMethod,
        codigo_referencia_qr: paymentMethod === 'QR' ? qrCode : null,
        comprobante_url: comprobanteUrl,
        estado: paymentMethod === 'EFECTIVO' ? 'PENDIENTE' : 'EN_VERIFICACION',
      });

      if (pagoError) throw pagoError;

      await supabase.from('horarios_medicos')
        .update({ disponible: false })
        .eq('id', selectedHorario.id);

      await supabase.from('notificaciones').insert({
        tutor_id: profileId,
        tipo: 'CITA',
        titulo: 'Cita Agendada',
        mensaje: `Tu cita con Dr(a). ${selectedMedico.nombres} ${selectedMedico.apellidos} para ${selectedPaciente.nombres} ha sido registrada.`,
      });

      showToast('Cita agendada exitosamente', 'success');
      onCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear la cita';
      showToast(msg, 'error');
      setCreating(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return selectedPaciente !== null;
    if (step === 2) return selectedMedico !== null && selectedHorario !== null;
    if (step === 3) return paymentMethod !== null;
    return true;
  };

  const formatDate = (fecha: string) =>
    new Date(fecha + 'T00:00:00').toLocaleDateString('es-BO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-500 px-5 pt-12 pb-5 flex items-center gap-3">
        <button onClick={onClose} className="p-2 rounded-lg bg-white/15 backdrop-blur-md text-white">
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-white">Agendar Cita</h1>
      </div>

      {/* Stepper */}
      <div className="px-5 py-4 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between">
          {[
            { n: 1, label: 'Paciente', icon: Baby },
            { n: 2, label: 'Médico', icon: Stethoscope },
            { n: 3, label: 'Pago', icon: QrCode },
            { n: 4, label: 'Confirmar', icon: CheckCircle2 },
          ].map((s, i) => {
            const Icon = s.icon;
            const isActive = step >= s.n;
            return (
              <div key={s.n} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {step > s.n ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      isActive ? 'text-teal-600' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 -mt-4 rounded-full transition-all ${
                      step > s.n ? 'bg-teal-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 no-scrollbar">
        {/* Step 1: Select Patient */}
        {step === 1 && (
          <div className="space-y-3 animate-fade-in">
            <h2 className="text-sm font-semibold text-slate-600 mb-2">
              Selecciona el dependiente
            </h2>
            {pacientes.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPaciente(p)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                  selectedPaciente?.id === p.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-slate-100 bg-white'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    p.sexo === 'M' ? 'bg-sky-100 text-sky-600' : 'bg-pink-100 text-pink-600'
                  }`}
                >
                  <Baby className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 text-sm">
                    {p.nombres} {p.apellidos}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {p.grupo_sanguineo ? `Tipo ${p.grupo_sanguineo}` : 'Sin grupo sanguíneo'}
                  </p>
                </div>
                {selectedPaciente?.id === p.id && (
                  <Check className="w-5 h-5 text-teal-600" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Select Medic + Schedule */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-sm font-semibold text-slate-600 mb-2">
                Especialidad / Pediatra
              </h2>
              <div className="space-y-2">
                {medicos.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMedico(m);
                      setSelectedHorario(null);
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                      selectedMedico?.id === m.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 text-sm">
                        Dr(a). {m.nombres} {m.apellidos}
                      </h3>
                      <p className="text-xs text-slate-500">{m.especialidad}</p>
                    </div>
                    {selectedMedico?.id === m.id && <Check className="w-5 h-5 text-teal-600" />}
                  </button>
                ))}
              </div>
            </div>

            {selectedMedico && (
              <div className="animate-fade-in">
                <h3 className="text-sm font-semibold text-slate-600 mb-2">
                  Horarios disponibles
                </h3>
                {loadingHorarios ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                  </div>
                ) : horarios.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No hay horarios disponibles para este médico.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {horarios.slice(0, 21).map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setSelectedHorario(h)}
                        className={`p-2.5 rounded-xl border-2 transition-all text-center ${
                          selectedHorario?.id === h.id
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-slate-100 bg-white hover:border-slate-200'
                        }`}
                      >
                        <div className="text-[10px] font-medium text-slate-500">
                          {formatDate(h.fecha)}
                        </div>
                        <div className="text-xs font-bold text-slate-700 mt-0.5">
                          {h.hora_inicio.slice(0, 5)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Payment Method */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-sm font-semibold text-slate-600 mb-2">Método de Pago</h2>

            <button
              onClick={() => setPaymentMethod('QR')}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                paymentMethod === 'QR'
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-slate-100 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 text-sm">Transferencia QR</h3>
                  <p className="text-xs text-slate-500">Escanea y sube tu comprobante</p>
                </div>
                {paymentMethod === 'QR' && <Check className="w-5 h-5 text-teal-600" />}
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod('EFECTIVO')}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                paymentMethod === 'EFECTIVO'
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-slate-100 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Banknote className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 text-sm">Pago en Efectivo</h3>
                  <p className="text-xs text-slate-500">Pago presencial en recepción</p>
                </div>
                {paymentMethod === 'EFECTIVO' && <Check className="w-5 h-5 text-teal-600" />}
              </div>
            </button>

            {paymentMethod === 'QR' && (
              <div className="bg-white rounded-2xl p-5 border border-slate-100 animate-scale-in">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-44 h-44 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center p-3">
                    <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-0.5">
                      {Array.from({ length: 64 }).map((_, i) => {
                        const seed = (qrCode.charCodeAt(i % qrCode.length) + i) % 3;
                        return (
                          <div
                            key={i}
                            className={`rounded-sm ${
                              seed === 0
                                ? 'bg-slate-900'
                                : seed === 1
                                ? 'bg-slate-200'
                                : 'bg-white'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Código de Referencia</p>
                    <p className="text-sm font-bold text-teal-600 font-mono mt-0.5">{qrCode}</p>
                  </div>
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Subir comprobante de pago
                    </label>
                    <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-slate-200 cursor-pointer hover:border-teal-400 transition-colors">
                      {comprobanteFile ? (
                        <>
                          <CheckCircle2 className="w-6 h-6 text-teal-500" />
                          <span className="text-xs text-slate-600">{comprobanteFile.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400" />
                          <span className="text-xs text-slate-400">
                            Toca para subir captura del pago
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'EFECTIVO' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 animate-scale-in">
                <Banknote className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Pago presencial en la recepción de la clínica. Presenta tu código de cita
                  el día de tu consulta.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col items-center py-4">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-teal-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Confirma tu Cita</h2>
              <p className="text-sm text-slate-500 mt-1">Revisa los detalles antes de confirmar</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-3">
              <ConfirmRow icon={<Baby className="w-4 h-4" />} label="Paciente">
                {selectedPaciente?.nombres} {selectedPaciente?.apellidos}
              </ConfirmRow>
              <ConfirmRow icon={<Stethoscope className="w-4 h-4" />} label="Médico">
                Dr(a). {selectedMedico?.nombres} {selectedMedico?.apellidos}
              </ConfirmRow>
              <ConfirmRow icon={<CalendarDays className="w-4 h-4" />} label="Fecha">
                {selectedHorario ? formatDate(selectedHorario.fecha) : ''}
              </ConfirmRow>
              <ConfirmRow icon={<Clock className="w-4 h-4" />} label="Hora">
                {selectedHorario?.hora_inicio.slice(0, 5)}
              </ConfirmRow>
              <ConfirmRow icon={<QrCode className="w-4 h-4" />} label="Pago">
                {paymentMethod === 'QR' ? 'Transferencia QR' : 'Efectivo en recepción'}
              </ConfirmRow>
              <ConfirmRow icon={<UserIcon className="w-4 h-4" />} label="Costo">
                Bs. 150
              </ConfirmRow>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="px-5 py-4 bg-white border-t border-slate-100 flex gap-3 safe-bottom">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => (s - 1) as Step)}
            disabled={creating}
            className="flex items-center gap-1.5 px-5 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" /> Atrás
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={() => canProceed() && setStep((s) => (s + 1) as Step)}
            disabled={!canProceed()}
            className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            Continuar <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Confirmando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> Confirmar Cita
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function ConfirmRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        {icon} {label}
      </div>
      <span className="text-sm font-medium text-slate-800">{children}</span>
    </div>
  );
}
