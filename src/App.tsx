import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import CarSales from './pages/CarSales';
import Workshop from './pages/Workshop';
import PublicInvoices from './pages/PublicInvoices';
import Login from './pages/Login';
import RegisterClient from './pages/RegisterClient';
import RegisterMechanic from './pages/RegisterMechanic';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import RegionalDashboard from './pages/RegionalDashboard';
import SubRegionalDashboard from './pages/SubRegionalDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with Layout */}
        <Route path="/" element={
          <ProtectedRoute route="/">
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/cars" element={
          <ProtectedRoute route="/cars">
            <Layout>
              <CarSales />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/workshop" element={
          <ProtectedRoute route="/workshop">
            <Layout>
              <Workshop />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/invoices" element={
          <ProtectedRoute route="/invoices">
            <Layout>
              <PublicInvoices />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Auth Routes without Layout */}
        <Route path="/login" element={
          <ProtectedRoute route="/login">
            <Login />
          </ProtectedRoute>
        } />
        
        <Route path="/register/client" element={
          <ProtectedRoute route="/register/client">
            <RegisterClient />
          </ProtectedRoute>
        } />
        
        <Route path="/register/mechanic" element={
          <ProtectedRoute route="/register/mechanic">
            <RegisterMechanic />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes without Layout */}
        <Route path="/admin/login" element={
          <ProtectedRoute route="/admin/login">
            <AdminLogin />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute route="/admin" requiredUserType="admin" requireAuth={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Manager Routes */}
        <Route path="/manager" element={
          <ProtectedRoute route="/manager" requireAuth={true}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />
        
        {/* Supervisor Routes */}
        <Route path="/supervisor" element={
          <ProtectedRoute route="/supervisor" requireAuth={true}>
            <SupervisorDashboard />
          </ProtectedRoute>
        } />
        
        {/* Regional Routes */}
        <Route path="/regional" element={
          <ProtectedRoute route="/regional" requireAuth={true}>
            <RegionalDashboard />
          </ProtectedRoute>
        } />
        
        {/* Sub Regional Routes */}
        <Route path="/subregional" element={
          <ProtectedRoute route="/subregional" requireAuth={true}>
            <SubRegionalDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;