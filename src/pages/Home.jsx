import { Link } from 'react-router-dom';
import './Home.css';
import './PublicPages.css';

export default function Home() {
    return (
        <div className="public-page-container">
            <div className="animated-bg-overlay">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <div className="page-content-wrapper">
                {/* Hero Section */}
                <section className="container hero animate-slide-up">
                    <div className="hero-content">
                        <h1>Clean Air, <span className="highlight">Greener Future</span></h1>
                        <p className="hero-text delay-100">
                            Leading the way in vehicle emission compliance.
                            We ensure your vehicle meets environmental standards with precision and speed.
                        </p>
                        <div className="hero-actions delay-200">
                            <Link to="/login" state={{ role: 'user' }} className="btn btn-primary btn-lg">User Login</Link>
                            <Link to="/login" state={{ role: 'staff' }} className="btn btn-secondary btn-lg">Staff Login</Link>
                        </div>
                    </div>
                    <div className="hero-image delay-300">
                        <div className="circle-bg"></div>
                        <img src="/hero-image-v2.png" alt="Eco Car Testing" className="floating-img" />
                    </div>
                </section>

                {/* Features Section */}
                <section className="container features animate-slide-up delay-300">
                    <div className="feature-card glass-card">
                        <div className="icon">🚀</div>
                        <h3>Fast Track Service</h3>
                        <p>Experience our 10-minute accelerated testing process designed for busy professionals.</p>
                    </div>
                    <div className="feature-card glass-card">
                        <div className="icon">🛡️</div>
                        <h3>Secure & Valid</h3>
                        <p>Tamper-proof digital certificates directly linked to the national transport database.</p>
                    </div>
                    <div className="feature-card glass-card">
                        <div className="icon">🌱</div>
                        <h3>Eco-Compliant</h3>
                        <p>Join thousands of responsible citizens contributing to a cleaner, healthier environment.</p>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <footer className="footer" style={{ position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.9)' }}>
                <p>&copy; {new Date().getFullYear()} ANBU Emission Test Centre. All rights reserved.</p>
                <p className="address">157/1 Chavadikattu Thottom, Sakthy Main Road, Erode - 638004</p>
            </footer>
        </div>
    );
}
