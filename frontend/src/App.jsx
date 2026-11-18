import AppRouter from './routes/AppRouter';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useAuth } from './context/AuthContext';

function AppContent() {
  const { isSigningOut } = useAuth();
  return <>
    <AppRouter />
    <AnimatePresence>
      {isSigningOut && <motion.div className="logout-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status" aria-live="polite">
        <span className="brand-mark"><Sparkles size={16} /></span><strong>Cerrando sesiÃ³nâ€¦</strong>
      </motion.div>}
    </AnimatePresence>
  </>;
}

export default function App() { return <ThemeProvider><AppContent /></ThemeProvider>; }
