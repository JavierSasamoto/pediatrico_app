import { useEffect, useState, useCallback } from 'react';
import { supabase, type Notificacion } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { SkeletonList, EmptyState } from '@/components/ui/Skeleton';
import {
  Bell,
  CreditCard,
  Calendar,
  Pill,
  Info,
  Check,
  CheckCheck,
} from 'lucide-react';

const tipoConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  PAGO: { icon: CreditCard, color: 'text-teal-600', bg: 'bg-teal-100' },
  CITA: { icon: Calendar, color: 'text-sky-600', bg: 'bg-sky-100' },
  RECETA: { icon: Pill, color: 'text-violet-600', bg: 'bg-violet-100' },
  GENERAL: { icon: Info, color: 'text-slate-600', bg: 'bg-slate-100' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' });
}

export function BuzonScreen() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificaciones = useCallback(async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('tutor_id', profile.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotificaciones(data as Notificacion[]);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  const handleMarkRead = async (id: string) => {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
    fetchNotificaciones();
  };

  const handleMarkAllRead = async () => {
    if (!profile) return;
    const unread = notificaciones.filter((n) => !n.leida);
    if (unread.length === 0) return;

    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .in('id', unread.map((n) => n.id));
    showToast('Todas las notificaciones marcadas como leídas', 'success');
    fetchNotificaciones();
  };

  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="pb-24 min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-teal-600 to-teal-500 px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Buzón</h1>
            <p className="text-teal-50 text-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : 'Sin notificaciones nuevas'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 backdrop-blur-md text-white text-xs font-medium hover:bg-white/25 transition-colors"
            >
              <CheckCheck className="w-4 h-4" /> Marcar todo
            </button>
          )}
        </div>
      </div>

      <div className="px-5 -mt-4">
        {loading ? (
          <SkeletonList count={4} />
        ) : notificaciones.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-8 h-8" />}
            title="Sin notificaciones"
            subtitle="Recibirás avisos sobre pagos, citas y recetas aquí"
          />
        ) : (
          <div className="space-y-2">
            {notificaciones.map((n) => {
              const config = tipoConfig[n.tipo] || tipoConfig.GENERAL;
              const Icon = config.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => !n.leida && handleMarkRead(n.id)}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl border transition-all text-left animate-fade-in ${
                    n.leida
                      ? 'bg-white border-slate-100'
                      : 'bg-teal-50/50 border-teal-200'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg} ${config.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm ${n.leida ? 'font-medium text-slate-700' : 'font-bold text-slate-800'}`}>
                        {n.titulo}
                      </h3>
                      {!n.leida && <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{n.mensaje}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {n.leida && <Check className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
