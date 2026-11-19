import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Check, LoaderCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import BrandLogo from '../../components/BrandLogo/BrandLogo';

const DEFAULT_DEMO_PROFILES = [
  {
    key: 'colaborador',
    initials: 'DC',
    title: 'Colaborador',
    name: 'Diego Chaves',
    description: 'Portal personal',
    email: 'diego.chaves@ticosoft.cr',
    role: 'colaborador',
  },
  {
    key: 'rrhh',
    initials: 'AS',
    title: 'RRHH',
    name: 'Ana Solís',
    description: 'Vista administrativa',
    email: 'ana.solis@ticosoft.cr',
    role: 'rrhh',
  },
];

function getInitials(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function LoginPage() {
  const { isAuthenticated, user, signIn } = useAuth();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState(DEFAULT_DEMO_PROFILES);
  const [selectedKey, setSelectedKey] = useState(DEFAULT_DEMO_PROFILES[0].key);
  const [email, setEmail] = useState(DEFAULT_DEMO_PROFILES[0].email);
  const [password, setPassword] = useState('DemoRRHH2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .getDemoUsers()
      .then((data) => {
        if (!active || !Array.isArray(data?.usuarios) || data.usuarios.length === 0) return;
        const colaborador = data.usuarios.find((u) => u.rol === 'colaborador') || data.usuarios[0];
        const rrhh = data.usuarios.find((u) => u.rol === 'rrhh');
        const nextProfiles = [colaborador, rrhh].filter(Boolean).map((u) => ({
          key: u.rol === 'rrhh' ? 'rrhh' : 'colaborador',
          initials: getInitials(u.nombre),
          title: u.rol === 'rrhh' ? 'RRHH' : 'Colaborador',
          name: u.nombre,
          description: u.rol === 'rrhh' ? 'Vista administrativa' : 'Portal personal',
          email: u.email,
          role: u.rol,
        }));
        if (nextProfiles.length > 0) {
          setProfiles(nextProfiles);
          setSelectedKey(nextProfiles[0].key);
          setEmail(nextProfiles[0].email);
          setPassword(data.password_prueba || 'DemoRRHH2026!');
        }
      })
      .catch(() => {
        // Conserva perfiles por defecto si el backend aun no responde
      });

    return () => {
      active = false;
    };
  }, []);

  if (isAuthenticated) {
    return <Navigate to={user.role === 'rrhh' ? '/rrhh/dashboard' : '/portal'} replace />;
  }

  const selectedProfile = profiles.find((p) => p.key === selectedKey) || profiles[0];

  const handleSelectProfile = (profile) => {
    setSelectedKey(profile.key);
    setEmail(profile.email);
    setPassword('DemoRRHH2026!');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const session = await signIn({ email: email.trim(), password });
      navigate(session.user.role === 'rrhh' ? '/rrhh/dashboard' : '/portal');
    } catch (loginError) {
      setError(loginError.message || 'No pudimos abrir la sesión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <motion.section className="login-story" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="brand-lockup light">
          <BrandLogo size={44} showText={true} theme="dark" />
        </div>
        <div className="story-copy">
          <p className="eyebrow">Un lugar para trabajar mejor</p>
          <h1>Las respuestas correctas, más cerca.</h1>
          <p>
            Un portal para entender tus políticas, cuidar tu tiempo y darle a RRHH una lectura clara de lo que está
            pasando.
          </p>
        </div>
        <div className="story-footer">
          <span>San José, Costa Rica</span>
          <span>Talento Humano</span>
        </div>
      </motion.section>

      <section className="login-form-wrap">
        <motion.div className="login-form-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="eyebrow">Acceso al portal</p>
          <h2>Bienvenido de vuelta</h2>
          <p className="form-intro">Elige un perfil de demostración o ingresa con tu correo registrado.</p>

          <div className="role-switch" role="radiogroup" aria-label="Selecciona el perfil de demostración">
            {profiles.map((profile) => (
              <motion.button
                key={profile.key}
                type="button"
                role="radio"
                aria-checked={selectedKey === profile.key}
                className={selectedKey === profile.key ? 'selected' : ''}
                onClick={() => handleSelectProfile(profile)}
                whileTap={{ scale: 0.98 }}
              >
                <span>{selectedKey === profile.key ? <Check size={14} /> : profile.initials}</span>
                <strong>{profile.title}</strong>
                <small>{profile.description}</small>
              </motion.button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              Correo electrónico
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-label="Correo electrónico"
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-label="Contraseña"
              />
            </label>

            <AnimatePresence mode="wait">
              <motion.p
                key={selectedProfile?.key}
                className="selected-account"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Perfil sugerido: <strong>{selectedProfile?.name || selectedProfile?.title}</strong>
              </motion.p>
            </AnimatePresence>

            {error && (
              <p className="feedback-error" role="alert">
                {error}
              </p>
            )}

            <motion.button className="button primary full-width" disabled={isLoading} whileTap={{ scale: 0.98 }}>
              {isLoading ? (
                <>
                  <LoaderCircle size={16} className="spin" /> Ingresando…
                </>
              ) : (
                <>
                  Iniciar sesión <ArrowUpRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          <Link className="register-link" to="/register">
            Crear una cuenta de trabajador <ArrowUpRight size={14} />
          </Link>
          <p className="demo-note">Directorio de acceso conectado al servidor seguro de TicoSoft</p>
        </motion.div>
      </section>
    </main>
  );
}
