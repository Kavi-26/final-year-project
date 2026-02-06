import { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Verification.css';
import './PublicPages.css';

export default function Verification() {
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!vehicleNumber.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const q = query(
                collection(db, "tests"),
                where("vehicleNumber", "==", vehicleNumber.trim())
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('No records found for this vehicle number.');
            } else {
                let latestTest = null;
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const testDate = data.testDate ? data.testDate.toDate() : new Date(0);
                    if (!latestTest || testDate > latestTest.testDateObj) {
                        latestTest = { id: doc.id, ...data, testDateObj: testDate };
                    }
                });

                const now = new Date();
                const expiryDate = latestTest.expiryDate ? latestTest.expiryDate.toDate() : new Date(0);
                const isValid = expiryDate > now;

                setResult({
                    ...latestTest,
                    isValid,
                    expiryDateString: expiryDate.toLocaleDateString()
                });
            }

        } catch (err) {
            console.error("Search error:", err);
            setError("An error occurred while searching. Please try again.");
        }

        setLoading(false);
    };

    return (
        <div className="public-page-container">
            <div className="animated-bg-overlay">
                <div className="blob blob-1" style={{ width: '400px', height: '400px' }}></div>
                <div className="blob blob-3" style={{ bottom: '10%', left: '20%' }}></div>
            </div>

            <div className="page-content-wrapper container verification-container">
                <div className="search-box glass-card animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)' }}>
                    <h1 className="text-gradient">Verify Certificate</h1>
                    <p style={{ color: '#64748b' }}>Enter vehicle number to check pollution test status.</p>

                    <form onSubmit={handleSearch} className="search-form">
                        <input
                            type="text"
                            placeholder="e.g. TN-01-AB-1234"
                            value={vehicleNumber}
                            onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                            className="search-input"
                        />
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? 'Searching...' : 'Verify'}
                        </button>
                    </form>

                    {error && <div className="error-msg animate-slide-up">{error}</div>}

                    {result && (
                        <div className={`result-card animate-slide-up ${result.isValid ? 'valid' : 'expired'}`}>
                            <div className="status-icon">
                                {result.isValid ? '✅' : '⚠️'}
                            </div>
                            <div className="result-info">
                                <h3>{result.vehicleNumber}</h3>
                                <p className="status-text">
                                    Status: <strong>{result.isValid ? 'VALID' : 'EXPIRED'}</strong>
                                </p>
                                <p>Expires on: {result.expiryDateString}</p>
                                <button
                                    className="btn-link"
                                    onClick={() => navigate(`/certificate/${result.id}`)}
                                >
                                    View & Download Certificate &rarr;
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
