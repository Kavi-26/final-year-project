export default function Contact() {
    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Contact Us</h1>

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Visit Us</h2>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>ANBU Emission Test Centre</p>
                    <p>157/1 Chavadikattu Thottom, Sakthy Main Road,</p>
                    <p>Erode, Tamil Nadu - 638004</p>

                    <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Hours</h3>
                    <p>Mon - Sat: 9:00 AM - 8:00 PM</p>
                    <p>Sun: 10:00 AM - 2:00 PM</p>
                </div>

                <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Get in Touch</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        Have questions about your certificate or need to book a fleet test?
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Phone</label>
                        <a href="tel:+919876543210" style={{ fontSize: '1.1rem' }}>+91 98765 43210</a>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Email</label>
                        <a href="mailto:support@anbu-emission.com" style={{ fontSize: '1.1rem' }}>support@anbu-emission.com</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
