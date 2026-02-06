import './PublicPages.css';

export default function About() {
    return (
        <div className="public-page-container">
            <div className="animated-bg-overlay">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <div className="page-content-wrapper container" style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="glass-card animate-slide-up" style={{ padding: '4rem 3rem', maxWidth: '800px', width: '100%' }}>
                    <h1 style={{ marginBottom: '1.5rem' }} className="text-gradient">About ANBU Emission Test</h1>
                    <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                        ANBU Emission Test Centre is a government-authorized facility dedicated to ensuring cleaner air for our community.
                        Established with the vision of reducing vehicular pollution, we use state-of-the-art equipment to provide accurate
                        and reliable emission testing services for all types of vehicles.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2.5rem', marginBottom: '1rem', color: '#1e293b' }}>Our Mission</h2>
                    <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                        To contribute to a healthier environment by ensuring every vehicle on the road complies with
                        emission standards set by the Government of India.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2.5rem', marginBottom: '1rem', color: '#1e293b' }}>Why Choose Us?</h2>
                    <ul style={{ listStyle: 'none', paddingLeft: '0', display: 'grid', gap: '1rem' }}>
                        {['Government Authorized & RTO Compliant', 'Advanced Gas Analysers & Smoke Meters', 'Quick Service (Under 10 Minutes)', 'Instant Digital Certificates', 'SMS Reminders for Expiry'].map((item, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                                <span style={{ color: 'var(--secondary-color)' }}>✔</span> {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
