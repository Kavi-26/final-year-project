
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './Login.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAdminLogin, setIsAdminLogin] = useState(false);

    // UI State for specific role view (staff/user)
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();

    const initialRole = location.state?.role || 'user';
    const [currentViewRole, setCurrentViewRole] = useState(initialRole);

    useEffect(() => {
        if (location.state?.role) {
            setCurrentViewRole(location.state.role);
        }
        if (location.state?.adminMode) {
            setIsAdminLogin(true);
        }
    }, [location.state]);

    // Hidden Gesture Logic
    const timerRef = useRef(null);

    const handleTouchStart = () => {
        timerRef.current = setTimeout(() => {
            setIsAdminLogin(prev => !prev);
            // Optional: Vibrate device if supported
            if (navigator.vibrate) navigator.vibrate(200);
        }, 2000); // 2 seconds long press
    };

    const handleTouchEnd = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Failed to log in. Please check your credentials.');
        }

        setLoading(false);
    };

    // Derived UI states
    const isStaffView = currentViewRole === 'staff';
    // Admin overrides everything if unlocked
    const displayTitle = isAdminLogin ? 'Admin Portal' : (isStaffView ? 'Staff Login' : 'User Login');
    // Ensure accurate placeholders as requested
    const displayPlaceholder = isAdminLogin ? "anbutest@gmail.com" : (isStaffView ? "staff@anbu.com" : "user@example.com");

    return (
        <div className={`login-container ${isAdminLogin ? 'admin-mode' : ''}`}>
            <div className="login-card">
                <div
                    className="login-header"
                    onMouseDown={handleTouchStart}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                    <h2>ANBU Emission Test</h2>
                    <h3>{displayTitle}</h3>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder={displayPlaceholder}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <button disabled={loading} type="submit" className="btn btn-primary btn-block">
                        {loading ? 'Logging in...' : (isAdminLogin ? 'Access Dashboard' : 'Log In')}
                    </button>
                </form>

                {/* Show Register link ONLY for Users (not Staff or Admin) */}
                {!isAdminLogin && !isStaffView && (
                    <div className="w-100 text-center mt-3" style={{ marginTop: '1rem', textAlign: 'center' }}>
                        Need an account? <Link to="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Register</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
