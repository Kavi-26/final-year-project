
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

            <div className="login-wrapper">
                {/* Left Side - Visual/Branding */}
                <div className="login-visual-side">
                    <div className="visual-content">
                        <div className="visual-icon-large">🍃</div>
                        <h2>Clean Air, <br />Greener Future.</h2>
                        <p>Join our mission to create a sustainable environment through efficient emission testing.</p>

                        <div className="visual-badges">
                            <span className="v-badge">🚀 Fast Process</span>
                            <span className="v-badge">🛡️ Secure Data</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="login-form-side">
                    <div className="login-card-header"
                        onMouseDown={handleTouchStart}
                        onMouseUp={handleTouchEnd}
                        onMouseLeave={handleTouchEnd}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <h3>{displayTitle}</h3>
                        <p className="subtitle">Welcome back! Please enter your details.</p>
                    </div>

                    {error && <div className="error-message">
                        <span className="err-icon">⚠️</span> {error}
                    </div>}

                    <form onSubmit={handleSubmit} className="modern-form">
                        <div className="input-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <span className="input-icon">✉️</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder={displayPlaceholder}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="form-extras">
                            <label className="checkbox-container">
                                <input type="checkbox" />
                                <span className="checkmark"></span>
                                Remember for 30 days
                            </label>
                            <a href="#" className="forgot-link">Forgot password?</a>
                        </div>

                        <button disabled={loading} type="submit" className="btn btn-primary btn-block btn-login-submit">
                            {loading ? 'Authenticating...' : (isAdminLogin ? 'Access Dashboard ➜' : 'Sign In ➜')}
                        </button>
                    </form>

                    {!isAdminLogin && !isStaffView && (
                        <div className="login-footer">
                            Don't have an account? <Link to="/register" className="register-link">Create free account</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
