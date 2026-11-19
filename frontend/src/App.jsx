import AppRouter from './routes/AppRouter';
import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  return <AppRouter />;
}

export default function App() { return <ThemeProvider><AppContent /></ThemeProvider>; }
