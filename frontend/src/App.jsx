import AppRouter from './routes/AppRouter';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import BrandLogo from './components/BrandLogo/BrandLogo';

function AppContent() {
  const { isSigningOut } = useAuth();
  return <>
    <AppRouter />
    <AnimatePresence>
      {isSigningOut && <motion.div className="logout-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status" aria-live="polite">
        <BrandLogo size={36} showText={false} compact={true} theme="light" /><strong>Cerrando sesión…</strong>
      </motion.div>}
    </AnimatePresence>
  </>;
}

export default function App() { return <ThemeProvider><AppContent /></ThemeProvider>; }
