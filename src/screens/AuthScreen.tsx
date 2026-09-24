import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { Baby, Eye, EyeOff, Loader2, Mail, Lock, User, Phone, IdCard } from 'lucide-react';

type Mode = 'login' | 'register';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [ciNit, setCiNit] = useState('');
  const [telefono, setTelefono] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email,
            nombres,
            apellidos,
            ci_nit: ciNit,
            telefono,
            role: 'TUTOR',
          });

          if (profileError) throw profileError;
          showToast('Cuenta creada exitosamente', 'success');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast('Bienvenido de vuelta', 'success');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ocurrió un error';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-600 via-teal-500 to-sky-500 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12">
        <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 shadow-lg">
          <Baby className="w-10 h-10 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">Clínica Pediátrica Integral</h1>
        <p className="text-teal-50 text-sm mt-1 text-center">
          {mode === 'login' ? 'Accede a tu portal de paciente' : 'Crea tu cuenta de tutor'}
        </p>
      </div>

      <div className="bg-white rounded-t-3xl px-6 pt-8 pb-8 mt-6 min-h-[55vh] animate-slide-up">
        <div className="flex gap-2 mb-6 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'login' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'register' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  icon={<User className="w-4 h-4" />}
                  placeholder="Nombres"
                  value={nombres}
                  onChange={setNombres}
                  required
                />
                <InputField
                  icon={<User className="w-4 h-4" />}
                  placeholder="Apellidos"
                  value={apellidos}
                  onChange={setApellidos}
                  required
                />
              </div>
              <InputField
                icon={<IdCard className="w-4 h-4" />}
                placeholder="CI / NIT"
                value={ciNit}
                onChange={setCiNit}
              />
              <InputField
                icon={<Phone className="w-4 h-4" />}
                placeholder="Teléfono"
                value={telefono}
                onChange={setTelefono}
                type="tel"
              />
            </>
          )}

          <InputField
            icon={<Mail className="w-4 h-4" />}
            placeholder="Correo electrónico"
            value={email}
            onChange={setEmail}
            type="email"
            required
          />

          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? 'Ingresar' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Al continuar aceptas los términos y condiciones del portal.
        </p>
      </div>
    </div>
  );
}

function InputField({
  icon,
  placeholder,
  value,
  onChange,
  type = 'text',
  required,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
      />
    </div>
  );
}
