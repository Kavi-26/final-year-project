export default function About() {
    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>About ANBU Emission Test</h1>
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                ANBU Emission Test Centre is a government-authorized facility dedicated to ensuring cleaner air for our community.
                Established with the vision of reducing vehicular pollution, we use state-of-the-art equipment to provide accurate
                and reliable emission testing services for all types of vehicles.
            </p>

            <h2 style={{ fontSize: '1.5rem', marginTop: '2.5rem', marginBottom: '1rem' }}>Our Mission</h2>
            <p style={{ marginBottom: '1rem' }}>
                To contribute to a healthier environment by ensuring every vehicle on the road complies with
                emission standards set by the Government of India.
            </p>

            <h2 style={{ fontSize: '1.5rem', marginTop: '2.5rem', marginBottom: '1rem' }}>Why Choose Us?</h2>
            <ul style={{ listStyle: 'disc', paddingLeft: '2rem', lineHeight: '1.8' }}>
                <li>Government Authorized & RTO Compliant</li>
                <li>Advanced Gas Analysers & Smoke Meters</li>
                <li>Quick Service (Under 10 Minutes)</li>
                <li>Instant Digital Certificates</li>
                <li>SMS Reminders for Expiry</li>
            </ul>
        </div>
    );
}
