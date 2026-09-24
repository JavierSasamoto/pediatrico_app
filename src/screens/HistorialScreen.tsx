import { useEffect, useState, useCallback } from 'react';
import { supabase, type HistoriaClinica, type Receta, type Paciente, type Medico } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { SkeletonList, EmptyState } from '@/components/ui/Skeleton';
import {
  FileText,
  Pill,
  FlaskConical,
  Stethoscope,
  Weight,
  Ruler,
  Thermometer,
  Download,
  MessageCircle,
  Calendar,
  Baby,
} from 'lucide-react';

type Tab = 'consultas' | 'recetas' | 'examenes';

export function HistorialScreen() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('consultas');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [historias, setHistorias] = useState<HistoriaClinica[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile) return;

    const [pacRes, medRes] = await Promise.all([
      supabase.from('pacientes').select('*').eq('tutor_id', profile.id),
      supabase.from('medicos').select('*'),
    ]);

    if (pacRes.data) setPacientes(pacRes.data as Paciente[]);
    if (medRes.data) setMedicos(medRes.data as Medico[]);

    const pacienteIds = (pacRes.data || []).map((p) => p.id);

    if (pacienteIds.length > 0) {
      const [histRes, recRes] = await Promise.all([
        supabase
          .from('historias_clinicas')
          .select('*')
          .in('paciente_id', pacienteIds)
          .order('fecha', { ascending: false }),
        supabase
          .from('recetas')
          .select('*')
          .in('paciente_id', pacienteIds)
          .order('fecha', { ascending: false }),
      ]);

      if (histRes.data) setHistorias(histRes.data as HistoriaClinica[]);
      if (recRes.data) setRecetas(recRes.data as Receta[]);
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getPaciente = (id: string) => pacientes.find((p) => p.id === id);
  const getMedico = (id: string) => medicos.find((m) => m.id === id);

  const handleDownloadReceta = (receta: Receta) => {
    const paciente = getPaciente(receta.paciente_id);
    const content = `CLÍNICA PEDIÁTRICA INTEGRAL\nRECETA MÉDICA\n\nPaciente: ${paciente?.nombres} ${paciente?.apellidos}\nFecha: ${new Date(receta.fecha).toLocaleDateString('es-BO')}\n\nMedicamento: ${receta.medicamento}\nDosis: ${receta.dosis}\nFrecuencia: ${receta.frecuencia}\nDuración: ${receta.duracion}\n${receta.indicaciones_tratamiento ? `\nIndicaciones: ${receta.indicaciones_tratamiento}` : ''}\n\nFirma digital - Clínica Pediátrica Integral`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receta_${receta.medicamento.replace(/\s/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Receta descargada', 'success');
  };

  const handleSendWhatsApp = (receta: Receta) => {
    const paciente = getPaciente(receta.paciente_id);
    const msg = `*CLÍNICA PEDIÁTRICA INTEGRAL - RECETA*\n\nPaciente: ${paciente?.nombres} ${paciente?.apellidos}\nMedicamento: ${receta.medicamento}\nDosis: ${receta.dosis}\nFrecuencia: ${receta.frecuencia}\nDuración: ${receta.duracion}${receta.indicaciones_tratamiento ? `\nIndicaciones: ${receta.indicaciones_tratamiento}` : ''}`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    showToast('Abriendo WhatsApp...', 'info');
  };

  const tabs: { id: Tab; label: string; icon: typeof FileText }[] = [
    { id: 'consultas', label: 'Consultas', icon: FileText },
    { id: 'recetas', label: 'Recetas PDF', icon: Pill },
    { id: 'examenes', label: 'Exámenes', icon: FlaskConical },
  ];

  return (
    <div className="pb-24 min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-teal-600 to-teal-500 px-5 pt-12 pb-6">
        <h1 className="text-xl font-bold text-white">Historial Clínico</h1>
        <p className="text-teal-50 text-sm mt-1">Consultas, recetas y exámenes</p>
      </div>

      {/* Tabs */}
      <div className="px-5 -mt-4">
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  tab === t.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <SkeletonList count={3} />
        ) : (
          <>
            {/* CONSULTAS */}
            {tab === 'consultas' && (
              <div className="space-y-3 animate-fade-in">
                {historias.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="w-8 h-8" />}
                    title="Sin consultas registradas"
                    subtitle="Las consultas médicas aparecerán aquí"
                  />
                ) : (
                  historias.map((h) => {
                    const paciente = getPaciente(h.paciente_id);
                    const medico = getMedico(h.medico_id);
                    return (
                      <div
                        key={h.id}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-fade-in"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-800 text-sm">
                              Dr(a). {medico?.nombres} {medico?.apellidos}
                            </h3>
                            <div className="flex flex-wrap gap-x-3 text-xs text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Baby className="w-3 h-3" /> {paciente?.nombres}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(h.fecha).toLocaleDateString('es-BO', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 mb-3">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Diagnóstico</p>
                          <p className="text-sm text-slate-700">{h.diagnostico}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {h.peso != null && (
                            <VitalSign icon={<Weight className="w-3.5 h-3.5" />} label="Peso" value={`${h.peso} kg`} />
                          )}
                          {h.altura != null && (
                            <VitalSign icon={<Ruler className="w-3.5 h-3.5" />} label="Altura" value={`${h.altura} cm`} />
                          )}
                          {h.temperatura != null && (
                            <VitalSign icon={<Thermometer className="w-3.5 h-3.5" />} label="Temp" value={`${h.temperatura}°C`} />
                          )}
                        </div>

                        {h.indicaciones_tratamiento && (
                          <div className="mt-3 text-xs text-slate-600 bg-amber-50 rounded-lg p-2.5 border border-amber-100">
                            <span className="font-semibold text-amber-700">Indicaciones: </span>
                            {h.indicaciones_tratamiento}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* RECETAS */}
            {tab === 'recetas' && (
              <div className="space-y-3 animate-fade-in">
                {recetas.length === 0 ? (
                  <EmptyState
                    icon={<Pill className="w-8 h-8" />}
                    title="Sin recetas registradas"
                    subtitle="Las recetas médicas aparecerán aquí"
                  />
                ) : (
                  recetas.map((r) => {
                    const paciente = getPaciente(r.paciente_id);
                    return (
                      <div
                        key={r.id}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-fade-in"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                            <Pill className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-800 text-sm">{r.medicamento}</h3>
                            <div className="flex flex-wrap gap-x-3 text-xs text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Baby className="w-3 h-3" /> {paciente?.nombres}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(r.fecha).toLocaleDateString('es-BO', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-slate-400 font-medium">Dosis</p>
                            <p className="text-xs font-semibold text-slate-700 mt-0.5">{r.dosis}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-slate-400 font-medium">Frecuencia</p>
                            <p className="text-xs font-semibold text-slate-700 mt-0.5">{r.frecuencia}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-slate-400 font-medium">Duración</p>
                            <p className="text-xs font-semibold text-slate-700 mt-0.5">{r.duracion}</p>
                          </div>
                        </div>

                        {r.indicaciones_tratamiento && (
                          <div className="mb-3 text-xs text-slate-600 bg-amber-50 rounded-lg p-2.5 border border-amber-100">
                            <span className="font-semibold text-amber-700">Indicaciones: </span>
                            {r.indicaciones_tratamiento}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownloadReceta(r)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 active:scale-95 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" /> Descargar PDF
                          </button>
                          <button
                            onClick={() => handleSendWhatsApp(r)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500 text-white text-xs font-semibold hover:bg-green-600 active:scale-95 transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Enviar WhatsApp
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* EXAMENES */}
            {tab === 'examenes' && (
              <EmptyState
                icon={<FlaskConical className="w-8 h-8" />}
                title="Sin exámenes registrados"
                subtitle="Los estudios y exámenes de laboratorio aparecerán aquí"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function VitalSign({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 text-center">
      <div className="flex items-center justify-center text-slate-400 mb-0.5">{icon}</div>
      <p className="text-[10px] text-slate-400 font-medium">{label}</p>
      <p className="text-xs font-bold text-slate-700">{value}</p>
    </div>
  );
}
