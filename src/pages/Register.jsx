import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; // Reusing Login styles for consistency

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        if (password.length < 6) {
            return setError('Password should be at least 6 characters');
        }

        try {
            setError('');
            setLoading(true);
            await signup(email, password, name, vehicleNumber, mobileNumber);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Failed to create an account. Email might be in use.');
        }

        setLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-wrapper">
                {/* Left Side - Visual */}
                <div className="login-visual-side">
                    <div className="visual-content">
                        <div className="visual-icon-large">⚡</div>
                        <h2>Join the <br />Revolution.</h2>
                        <p>Create an account to track metrics, get certified, and contribute to a cleaner planet.</p>

                        <div className="visual-badges">
                            <span className="v-badge">🌍 Eco Friendly</span>
                            <span className="v-badge">📊 Global Standards</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="login-form-side">
                    <div className="login-card-header">
                        <h3>Create Account</h3>
                        <p className="subtitle">Get started with your free account today.</p>
                    </div>

                    {error && <div className="error-message">
                        <span className="err-icon">⚠️</span> {error}
                    </div>}

                    <form onSubmit={handleSubmit} className="modern-form">
                        <div className="input-group">
                            <label>Full Name</label>
                            <div className="input-wrapper">
                                <span className="input-icon">👤</span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label>Vehicle No.</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🚗</span>
                                    <input
                                        type="text"
                                        value={vehicleNumber}
                                        onChange={(e) => setVehicleNumber(e.target.value)}
                                        required
                                        placeholder="TN-01-AB-1234"
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Mobile No.</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">📱</span>
                                    <input
                                        type="tel"
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        required
                                        placeholder="9876543210"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <span className="input-icon">✉️</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="user@example.com"
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

                        <div className="input-group">
                            <label>Confirm Password</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🔐</span>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button disabled={loading} type="submit" className="btn btn-primary btn-block btn-login-submit">
                            {loading ? 'Creating Account...' : 'Sign Up ➜'}
                        </button>
                    </form>

                    <div className="login-footer">
                        Already have an account? <Link to="/login" className="register-link">Log In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
