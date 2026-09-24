import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthScreen } from '@/screens/AuthScreen';
import { BottomNav, type TabId } from '@/components/BottomNav';
import { PerfilScreen } from '@/screens/PerfilScreen';
import { CitasScreen } from '@/screens/CitasScreen';
import { HistorialScreen } from '@/screens/HistorialScreen';
import { BuzonScreen } from '@/screens/BuzonScreen';
import { supabase, type Notificacion } from '@/lib/supabase';
import { Loader2, Baby } from 'lucide-react';

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('citas');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notificaciones')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', session.user.id)
        .eq('leida', false);
      setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel('notificaciones-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificaciones',
          filter: `tutor_id=eq.${session.user.id}`,
        },
        () => fetchUnread()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-teal-600 flex items-center justify-center shadow-lg">
          <Baby className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (!session || !profile) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto relative">
      {activeTab === 'citas' && <CitasScreen />}
      {activeTab === 'historial' && <HistorialScreen />}
      {activeTab === 'buzon' && <BuzonScreen />}
      {activeTab === 'perfil' && <PerfilScreen />}
      <BottomNav active={activeTab} onChange={setActiveTab} unreadCount={unreadCount} />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
