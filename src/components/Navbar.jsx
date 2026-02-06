import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container container">
                <div
                    className="navbar-brand"
                    onClick={() => navigate('/')}
                >
                    <span className="brand-icon">🍃</span>
                    <span className="brand-text">ANBU <span className="highlight">Emission</span></span>
                </div>

                <div className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
                    <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
                    <Link to="/about" className={`nav-link ${isActive('/about')}`}>About</Link>
                    <Link to="/contact" className={`nav-link ${isActive('/contact')}`}>Contact</Link>
                    <Link to="/verification" className={`nav-link ${isActive('/verification')}`}>Verify</Link>

                    <div className="nav-actions">
                        <Link to="/login" className="btn-login">Login</Link>
                    </div>
                </div>

                <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle Navigation"
                >
                    <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}></span>
                </button>
            </div>
        </nav>
    );
}
