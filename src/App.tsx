import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminPage } from './pages/AdminPage';
import { CalendarPage } from './pages/CalendarPage';
import { useAppStore } from './store';

function ThemeController() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
  }, []);

  return null;
}

function AppBoot() {
  const initializeApp = useAppStore((state) => state.initializeApp);
  const isReady = useAppStore((state) => state.isReady);
  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);

  useEffect(() => {
    void initializeApp();
  }, [initializeApp]);

  if (!isReady && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-text-secondary">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="rounded-2xl border border-danger/40 bg-white p-4">
          <h1 className="font-semibold text-danger">Initialization failed</h1>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ThemeController />
      <Routes>
        <Route path="/" element={<CalendarPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return <AppBoot />;
}
