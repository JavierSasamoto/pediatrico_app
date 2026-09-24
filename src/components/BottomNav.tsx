import { Calendar, FileText, Bell, User } from 'lucide-react';

export type TabId = 'citas' | 'historial' | 'buzon' | 'perfil';

const tabs: { id: TabId; label: string; icon: typeof Calendar }[] = [
  { id: 'citas', label: 'Citas', icon: Calendar },
  { id: 'historial', label: 'Historial', icon: FileText },
  { id: 'buzon', label: 'Buzón', icon: Bell },
  { id: 'perfil', label: 'Perfil', icon: User },
];

export function BottomNav({
  active,
  onChange,
  unreadCount,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
  unreadCount: number;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 safe-bottom z-50">
      <div className="flex items-center justify-around px-2 py-1.5 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
                isActive ? 'text-teal-600' : 'text-slate-400'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {tab.id === 'buzon' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-teal-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
