import { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Verification.css';

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
            // Create a query against the collection.
            // We want the LATEST test for this vehicle.
            const q = query(
                collection(db, "tests"),
                where("vehicleNumber", "==", vehicleNumber.trim()),
                // Note: Composite index might be required for vehicleNumber + testDate desc.
                // For now, let's just filter by vehicleNumber and sort client-side or assume standard index.
                // If index error occurs, we can just filter and find max in JS for this prototype stability.
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('No records found for this vehicle number.');
            } else {
                // Find the latest test
                let latestTest = null;
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const testDate = data.testDate ? data.testDate.toDate() : new Date(0);
                    if (!latestTest || testDate > latestTest.testDateObj) {
                        latestTest = { id: doc.id, ...data, testDateObj: testDate };
                    }
                });

                // Check validity
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
            // Fallback for index requirement issues
            if (err.message.includes("index")) {
                setError("System indexing in progress. Please try again later or contact admin.");
                // In dev, we can log the link to create index
                console.log(err.message);
            } else {
                setError("An error occurred while searching.");
            }
        }

        setLoading(false);
    };

    return (
        <div className="verification-container">
            <div className="search-box">
                <h1>Verify Certificate</h1>
                <p>Enter vehicle number to check pollution test status.</p>

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

                {error && <div className="error-msg">{error}</div>}

                {result && (
                    <div className={`result-card ${result.isValid ? 'valid' : 'expired'}`}>
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
    );
}
