import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import './i18n';
import Navbar from './components/layout/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MarketplacePage from './pages/MarketplacePage';
import AddCropPage from './pages/AddCropPage';
import CropDetailPage from './pages/CropDetailPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import SettingsPage from './pages/SettingsPage';

const LoadingScreen = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a3a2a,#2d6a4f)' }}>
    <div style={{ textAlign: 'center', color: '#fff' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🌾</div>
      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.8rem', color: '#52b788', fontWeight: 700 }}>
        Agro<span style={{ color: '#f4a261' }}>AI</span>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 10, fontSize: '0.875rem' }}>Loading…</div>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const map = { farmer: '/farmer', buyer: '/buyer', admin: '/admin' };
    return <Navigate to={map[user.role] || '/login'} replace />;
  }
  return children;
};

const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    const map = { farmer: '/farmer', buyer: '/buyer', admin: '/admin' };
    return <Navigate to={map[user.role] || '/farmer'} replace />;
  }
  return children;
};

// Navbar is hidden on the landing page — LandingPage has its own topbar
const AppShell = ({ children }) => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const showNavbar = !!user && pathname !== '/';
  return <>{showNavbar && <Navbar />}{children}</>;
};

function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
        <Route path="/farmer" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerDashboard /></ProtectedRoute>} />
        <Route path="/crop-add" element={<ProtectedRoute allowedRoles={['farmer']}><AddCropPage /></ProtectedRoute>} />
        <Route path="/buyer" element={<ProtectedRoute allowedRoles={['buyer']}><BuyerDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute allowedRoles={['farmer', 'buyer', 'admin']}><MarketplacePage /></ProtectedRoute>} />
        <Route path="/crop/:id" element={<ProtectedRoute allowedRoles={['farmer', 'buyer', 'admin']}><CropDetailPage /></ProtectedRoute>} />
        <Route path="/payment-success" element={<ProtectedRoute allowedRoles={['buyer']}><PaymentSuccessPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['farmer', 'buyer']}><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}