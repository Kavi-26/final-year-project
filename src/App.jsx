import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardHome from './pages/dashboard/Home';
import NewTest from './pages/dashboard/NewTest';
import Staff from './pages/dashboard/Staff';
import Users from './pages/dashboard/Users';
import VehicleList from './pages/dashboard/VehicleList';
import AddVehicle from './pages/dashboard/AddVehicle';
import Reports from './pages/dashboard/Reports';
import Verification from './pages/Verification';
import About from './pages/About';
import Contact from './pages/Contact';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Certificate from './pages/Certificate';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/verify" element={<Verification />} />
            <Route path="/certificate/:id" element={<Certificate />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Admin/Staff/User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'user']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardHome />} />
            <Route path="new-test" element={<NewTest />} />
            <Route path="reports" element={<Reports />} />
            <Route path="staff" element={<Staff />} />
            <Route path="users" element={<Users />} />
            <Route path="vehicles" element={<VehicleList />} />
            <Route path="add-vehicle" element={<AddVehicle />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
