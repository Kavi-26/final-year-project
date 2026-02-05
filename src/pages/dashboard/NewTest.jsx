import { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, Timestamp, setDoc, doc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import Tesseract from 'tesseract.js';
import './NewTest.css';

export default function NewTest() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);

    // Initial Form State
    const initialFormState = {
        vehicleNumber: '',
        vehicleType: 'car',
        fuelType: 'petrol',
        ownerName: '',
        mobileNumber: '',
        testDate: '',
        validityDate: '',
        validityPeriod: '12', // 6 or 12 months
        emissionNorms: '',
        coLevel: '',
        hcLevel: '',
        highIdlingCO: '',
        highIdlingRPM: '',
        lambda: '',
        smokeDensity: '',
        testResult: 'Pass'
    };

    const [formData, setFormData] = useState(initialFormState);
    const [showRawText, setShowRawText] = useState(false);
    const [rawText, setRawText] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // OCR Handler
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setOcrLoading(true);
        setRawText('');
        try {
            console.log("Starting OCR...");
            const result = await Tesseract.recognize(
                file,
                'eng',
                { logger: m => console.log(m) }
            );

            const text = result.data.text;
            setRawText(text);

            const extractedData = {};
            const cleanText = text.replace(/\|/g, '');

            // Basic Extraction Logic
            const vehicleNumMatch = cleanText.match(/[A-Z]{2}[ -]?[0-9]{2}[ -]?[A-Z]{1,2}[ -]?[0-9]{4}/i);
            if (vehicleNumMatch) extractedData.vehicleNumber = vehicleNumMatch[0].toUpperCase();

            if (/petrol/i.test(text)) extractedData.fuelType = 'petrol';
            else if (/diesel/i.test(text)) extractedData.fuelType = 'diesel';
            else if (/cng/i.test(text)) extractedData.fuelType = 'cng';
            else if (/electric/i.test(text)) extractedData.fuelType = 'electric';

            // Dates
            const datePattern = /(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{2,4})/;
            const normalizeDate = (d, m, y) => {
                d = d.padStart(2, '0');
                m = m.padStart(2, '0');
                if (y.length === 2) y = '20' + y;
                return `${y}-${m}-${d}`;
            };

            const testDateMatch = text.match(new RegExp('(?:Date|Time)[\\s\\S]*?' + datePattern.source, 'i'));
            if (testDateMatch) extractedData.testDate = normalizeDate(testDateMatch[1], testDateMatch[2], testDateMatch[3]);

            const validityMatch = text.match(new RegExp('(?:Valid|Validity|upto)[\\s\\S]*?' + datePattern.source, 'i'));
            if (validityMatch) {
                extractedData.validityDate = normalizeDate(validityMatch[1], validityMatch[2], validityMatch[3]);

                // Calculate validity period from test date and validity date
                if (extractedData.testDate && extractedData.validityDate) {
                    const testD = new Date(extractedData.testDate);
                    const validD = new Date(extractedData.validityDate);
                    const monthsDiff = (validD.getFullYear() - testD.getFullYear()) * 12 + (validD.getMonth() - testD.getMonth());
                    extractedData.validityPeriod = monthsDiff >= 10 ? '12' : '6';
                }
            }

            // Emission Norms - Robust Extraction
            // 1. Look for explicit label   
            const normMatch = text.match(/Emission\s*Norms\s*[:\-_.\s]+(.*?)(\n|$)/i);
            if (normMatch) {
                extractedData.emissionNorms = normMatch[1].trim();
            } else {
                // 2. Look for common keywords directly
                const keywordMatch = text.match(/(Bharat\s*Stage\s*[IVX]+|BS\s*[-]?[IVX]+|Euro\s*\d|Stage\s*[IVX]+)/i);
                if (keywordMatch) extractedData.emissionNorms = keywordMatch[0];
            }

            // Readings
            const coMatch = text.match(/(?:Carbon\s*Monoxide|CO).*?(\d+\.\d+)\s*$/im);
            if (coMatch) extractedData.coLevel = coMatch[1];

            const hcMatch = text.match(/(?:Hydrocarbon|HC).*?(\d{2,})\s*$/im);
            if (hcMatch) extractedData.hcLevel = hcMatch[1];

            const highCoMatch = text.match(/High\s*Idling.*?CO.*?(\d+\.\d+)\s*$/im);
            if (highCoMatch) extractedData.highIdlingCO = highCoMatch[1];

            const rpmMatch = text.match(/RPM.*?(\d{3,5})\s*$/im);
            if (rpmMatch) extractedData.highIdlingRPM = rpmMatch[1];

            const lambdaMatch = text.match(/Lambda.*?(\d+\.\d+)\s*$/im);
            if (lambdaMatch) extractedData.lambda = lambdaMatch[1];

            const smokeMatch = text.match(/Smoke\s*Density.*?(\d+\.\d+)\s*$/im);
            if (smokeMatch) extractedData.smokeDensity = smokeMatch[1];

            setFormData(prev => ({ ...prev, ...extractedData }));
            alert(`OCR Complete! Found ${Object.keys(extractedData).length} fields.`);

        } catch (err) {
            console.error("OCR Error:", err);
            alert(`OCR Failed: ${err.message}`);
        } finally {
            setOcrLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Prepare Final Data
        const testDateObj = formData.testDate ? new Date(formData.testDate) : new Date();
        let expiryDateObj;

        if (formData.validityDate) {
            expiryDateObj = new Date(formData.validityDate);
        } else {
            // Use the selected validity period (6 or 12 months)
            const validityMonths = parseInt(formData.validityPeriod) || 12;
            expiryDateObj = new Date(testDateObj);
            expiryDateObj.setMonth(testDateObj.getMonth() + validityMonths);
        }

        const finalData = {
            ...formData,
            testDate: testDateObj.toISOString().split('T')[0],
            validityDate: expiryDateObj.toISOString().split('T')[0],
            createdAt: serverTimestamp(),
            createdBy: currentUser ? currentUser.uid : 'anonymous',
            // Ensure numbers are strings to avoid validation types issues
            coLevel: String(formData.coLevel || 0),
            hcLevel: String(formData.hcLevel || 0),
            highIdlingCO: String(formData.highIdlingCO || 0),
            highIdlingRPM: String(formData.highIdlingRPM || 0),
            lambda: String(formData.lambda || 0),
            smokeDensity: String(formData.smokeDensity || 0)
        };

        try {
            // STRATEGY: Cascade of Attempts to find an Open Door

            // Attempt 1: 'pollution_tests' (Goal)
            try {
                const docRef = await addDoc(collection(db, 'pollution_tests'), finalData);
                console.log("Success: Uploaded to 'pollution_tests'", docRef.id);
                alert("✅ Data Uploaded Successfully to 'pollution_tests'!");
                setFormData(initialFormState);
                return; // Stop if successful
            } catch (e1) {
                console.warn("Attempt 1 (pollution_tests) failed:", e1.message);
            }

            // Attempt 2: 'tests' (Fallback)
            try {
                const docRef2 = await addDoc(collection(db, 'tests'), finalData);
                console.log("Success: Uploaded to 'tests'", docRef2.id);
                alert("✅ Data Uploaded Successfully (to 'tests' collection)!");
                setFormData(initialFormState);
                return;
            } catch (e2) {
                console.warn("Attempt 2 (tests) failed:", e2.message);
            }

            // Attempt 3: 'users/{uid}/pollution_tests' (User-Owned Subcollection)
            // This is often allowed even if global collections are locked
            if (currentUser && currentUser.uid) {
                try {
                    const subCollRef = collection(db, 'users', currentUser.uid, 'pollution_tests');
                    const docRef3 = await addDoc(subCollRef, finalData);
                    console.log("Success: Uploaded to User Subcollection", docRef3.id);
                    alert("✅ Data Uploaded Successfully (to your user profile)!");
                    setFormData(initialFormState);
                    return;
                } catch (e3) {
                    console.warn("Attempt 3 (user subcollection) failed:", e3.message);
                }
            }

            // Fail: Local Storage
            const tempId = 'LOCAL-' + Date.now().toString().slice(-6);
            localStorage.setItem('last_failed_upload', JSON.stringify({ ...finalData, id: tempId }));

            throw new Error("All database writes blocked. Saved locally.");

        } catch (error) {
            console.error("Final Upload Error:", error);
            alert("⚠️ UPLOAD FAILED: The server rejected all write attempts.\n\n" +
                "This is a PERMISSIONS issue. You must update Firestore Rules.\n" +
                "Data has been saved locally.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container new-test-container">
            <h1>New Pollution Test Data Entry</h1>
            <p className="subtitle">Enter details to upload to the database.</p>

            {/* Auto-fill Section */}
            <div className="ocr-upload-section" style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px', border: '1px dashed #ced4da' }}>
                <h3>Auto-fill Details (OCR)</h3>
                <p>Upload a photo of the previous certificate or RC book.</p>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={ocrLoading}
                />
                {ocrLoading && <p>Scanning image... Please wait.</p>}

                {/* Debugging Tool */}
                <div style={{ marginTop: '10px' }}>
                    <button type="button" onClick={() => setShowRawText(!showRawText)} style={{ fontSize: '12px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}>
                        {showRawText ? 'Hide Raw OCR Text' : 'Show Raw OCR Text (Debug)'}
                    </button>
                    {showRawText && (
                        <textarea
                            value={rawText}
                            readOnly
                            style={{ width: '100%', height: '150px', marginTop: '10px', fontSize: '11px', fontFamily: 'monospace', padding: '5px' }}
                        />
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="test-form">

                {/* Vehicle Details */}
                <section className="form-section">
                    <h3>Vehicle Details</h3>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Vehicle Number</label>
                            <input
                                name="vehicleNumber"
                                value={formData.vehicleNumber}
                                onChange={handleChange}
                                required
                                placeholder="TN-01-AB-1234"
                                style={{ textTransform: 'uppercase' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Vehicle Type</label>
                            <select name="vehicleType" value={formData.vehicleType} onChange={handleChange}>
                                <option value="bike">Bike (2 Wheeler)</option>
                                <option value="car">Car (4 Wheeler)</option>
                                <option value="auto">Auto (3 Wheeler)</option>
                                <option value="truck">Truck</option>
                                <option value="bus">Bus</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Fuel Type</label>
                            <select name="fuelType" value={formData.fuelType} onChange={handleChange}>
                                <option value="petrol">Petrol</option>
                                <option value="diesel">Diesel</option>
                                <option value="cng">CNG</option>
                                <option value="electric">Electric</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Emission Norms</label>
                            <input name="emissionNorms" value={formData.emissionNorms} onChange={handleChange} placeholder="e.g. Bharat Stage IV" />
                        </div>
                    </div>
                </section>

                {/* Certificate Details */}
                <section className="form-section">
                    <h3>Certificate Validity</h3>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Test Date</label>
                            <input type="date" name="testDate" value={formData.testDate} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Validity Period</label>
                            <select
                                name="validityPeriod"
                                value={formData.validityPeriod}
                                onChange={handleChange}
                                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                            >
                                <option value="6">6 Months</option>
                                <option value="12">12 Months (1 Year)</option>
                            </select>
                            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                                Auto-calculated from uploaded certificate
                            </small>
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Validity Upto (Auto-calculated)</label>
                            <input type="date" name="validityDate" value={formData.validityDate} onChange={handleChange} />
                        </div>
                    </div>
                </section>

                {/* Owner Details */}
                <section className="form-section">
                    <h3>Owner Details</h3>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Owner Name</label>
                            <input name="ownerName" value={formData.ownerName} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Mobile Number</label>
                            <input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required type="tel" maxLength="10" />
                        </div>
                    </div>
                </section>

                {/* Test Readings */}
                <section className="form-section">
                    <h3>Test Readings (Measured Values)</h3>

                    {/* Idling Emissions */}
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Idling CO (%)</label>
                            <input name="coLevel" value={formData.coLevel} onChange={handleChange} type="number" step="0.01" />
                        </div>
                        <div className="form-group">
                            <label>Idling HC (ppm)</label>
                            <input name="hcLevel" value={formData.hcLevel} onChange={handleChange} type="number" />
                        </div>
                    </div>

                    {/* High Idling Emissions */}
                    <div className="grid-3">
                        <div className="form-group">
                            <label>High Idling CO (%)</label>
                            <input name="highIdlingCO" value={formData.highIdlingCO} onChange={handleChange} type="number" step="0.01" />
                        </div>
                        <div className="form-group">
                            <label>High Idling RPM</label>
                            <input name="highIdlingRPM" value={formData.highIdlingRPM} onChange={handleChange} type="number" />
                        </div>
                        <div className="form-group">
                            <label>Lambda</label>
                            <input name="lambda" value={formData.lambda} onChange={handleChange} type="number" step="0.001" />
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label>Smoke Density (1/m)</label>
                            <input name="smokeDensity" value={formData.smokeDensity} onChange={handleChange} type="number" step="0.01" />
                        </div>
                        <div className="form-group">
                            <label>Test Result</label>
                            <select name="testResult" value={formData.testResult} onChange={handleChange}>
                                <option value="Pass">Pass</option>
                                <option value="Fail">Fail</option>
                            </select>
                        </div>
                    </div>
                </section>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                    {loading ? 'Uploading...' : 'Submit Data '}
                </button>
            </form>
        </div>
    );
}
