import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import './DashboardLayout.css';

export default function DashboardLayout() {
    const { logout, userRole } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch {
            console.error('Failed to log out');
        }
    };

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>ANBU Admin</h2>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`}>
                        Dashboard
                    </Link>
                    {(userRole === 'admin' || userRole === 'staff') && (
                        <Link to="/dashboard/new-test" className={`nav-item ${isActive('/dashboard/new-test')}`}>
                            New Test
                        </Link>
                    )}
                    <Link to="/dashboard/reports" className={`nav-item ${isActive('/dashboard/reports')}`}>
                        Reports
                    </Link>
                    {userRole === 'admin' && (
                        <>
                            <Link to="/dashboard/staff" className={`nav-item ${isActive('/dashboard/staff')}`}>
                                Staff Management
                            </Link>
                            <Link to="/dashboard/users" className={`nav-item ${isActive('/dashboard/users')}`}>
                                User Management
                            </Link>
                        </>
                    )}
                    {userRole === 'user' && (
                        <Link to="/dashboard/vehicles" className={`nav-item ${isActive('/dashboard/vehicles')}`}>
                            My Vehicles
                        </Link>
                    )}
                    <Link to="/dashboard/profile" className={`nav-item ${isActive('/dashboard/profile')}`}>
                        My Profile
                    </Link>
                </nav>
                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
            </aside>
            <main className="dashboard-content">
                <Outlet />
            </main>
        </div>
    );
}
