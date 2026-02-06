import './PublicPages.css';

export default function Contact() {
    return (
        <div className="public-page-container">
            <div className="animated-bg-overlay">
                <div className="blob blob-2" style={{ top: '10%', right: '50%' }}></div>
                <div className="blob blob-3"></div>
            </div>

            <div className="page-content-wrapper container" style={{ padding: '4rem 1rem', maxWidth: '1000px' }}>
                <h1 style={{ marginBottom: '2rem', textAlign: 'center' }} className="text-gradient animate-slide-up">Contact Us</h1>

                <div className="animate-slide-up delay-100" style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    <div className="glass-card" style={{ padding: '2.5rem', height: '100%' }}>
                        <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Visit Us</h2>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>📍</span>
                            <div>
                                <p style={{ fontWeight: 'bold', marginBottom: '0.2rem', color: '#334155' }}>ANBU Emission Test Centre</p>
                                <p style={{ color: '#64748b' }}>157/1 Chavadikattu Thottom, Sakthy Main Road,<br />Erode, Tamil Nadu - 638004</p>
                            </div>
                        </div>

                        <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.1rem', color: '#334155' }}>Opening Hours</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#64748b' }}>
                            <span>Mon - Sat:</span>
                            <span>9:00 AM - 8:00 PM</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                            <span>Sun:</span>
                            <span>10:00 AM - 2:00 PM</span>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '2.5rem', height: '100%' }}>
                        <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Get in Touch</h2>
                        <p style={{ marginBottom: '2rem', color: '#64748b' }}>
                            Have questions about your certificate or need to book a fleet test?
                        </p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#475569' }}>Phone</label>
                            <a href="tel:+919876543210" style={{ fontSize: '1.2rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}>+91 98765 43210</a>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#475569' }}>Email</label>
                            <a href="mailto:support@anbu-emission.com" style={{ fontSize: '1.2rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}>support@anbu-emission.com</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
