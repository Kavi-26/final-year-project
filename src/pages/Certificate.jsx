import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import QRCode from "react-qr-code";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './Certificate.css'; // Need to create this

export default function Certificate() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const certificateRef = useRef();

    useEffect(() => {
        const fetchCert = async () => {
            try {
                const docRef = doc(db, 'tests', id);
                console.log("Fetching certificate for ID:", id);
                // Try 'pollution_tests' if 'tests' fails or just try both
                // The current NewTest uploads to 'pollution_tests' primarily now?
                // Wait, NewTest attempts pollution_tests first, then tests.
                // Home.jsx reads from 'tests'.
                // I should assume 'tests' for now based on Home.jsx, but let's check both if needed.
                // Actually, Home.jsx reads 'tests'. So I will stick to 'tests' for consistency with Home.jsx.
                // IF NewTest was writing to 'pollution_tests', Home.jsx wouldn't see it.
                // Let's check NewTest.jsx again? It writes to 'pollution_tests' FIRST.
                // So Home.jsx MIGHT be reading the wrong collection if I didn't update it to read 'pollution_tests'.
                // Home.jsx: `collection(db, 'tests')`.
                // NewTest.jsx: `collection(db, 'pollution_tests')`.
                // This is a disconnect! 
                // I should fix Home.jsx to read 'pollution_tests' OR 'tests'. Or I should read both here.

                // Priortize 'pollution_tests' as per new requirement
                let d = await getDoc(doc(db, 'pollution_tests', id));
                if (!d.exists()) {
                    d = await getDoc(doc(db, 'tests', id));
                }

                if (d.exists()) {
                    setData(d.data());
                } else {
                    console.error("Certificate not found");
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCert();
    }, [id]);

    const handleDownloadPDF = async () => {
        const element = certificateRef.current;
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Certificate-${data?.vehicleNumber || 'pollution'}.pdf`);
    };

    if (loading) return <div>Loading Certificate...</div>;
    if (!data) return <div>Certificate not found!</div>;

    return (
        <div className="certificate-page">
            <div className="no-print download-bar">
                <button onClick={handleDownloadPDF} className="btn-download">Download PDF</button>
                <button onClick={() => window.print()} className="btn-print">Print</button>
            </div>

            <div className="certificate-container" ref={certificateRef}>
                <div className="cert-header">
                    <div className="logo-area">
                        <h1>POLLUTION UNDER CONTROL CERTIFICATE</h1>
                        <p>Authorized by Transport Department</p>
                    </div>
                    <div className="qr-area">
                        <QRCode value={`https://app-url/certificate/${id}`} size={80} />
                    </div>
                </div>

                <div className="cert-content">
                    <div className="row">
                        <div className="field">
                            <label>Certificate No:</label>
                            <span>{id}</span>
                        </div>
                        <div className="field">
                            <label>Date of Test:</label>
                            <span>{data.testDate && new Date(data.testDate).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="row">
                        <div className="field">
                            <label>Vehicle No:</label>
                            <span className="highlight">{data.vehicleNumber}</span>
                        </div>
                        <div className="field">
                            <label>Fuel Type:</label>
                            <span>{data.fuelType}</span>
                        </div>
                    </div>

                    <div className="row">
                        <div className="field">
                            <label>Result:</label>
                            <span className={`status ${data.testResult?.toLowerCase()}`}>{data.testResult}</span>
                        </div>
                        <div className="field">
                            <label>Valid Upto:</label>
                            <span className="highlight">
                                {data.validityDate && new Date(data.validityDate).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    <div className="emissions-table">
                        <h3>Emission Readings</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Parameter</th>
                                    <th>Measured Value</th>
                                    <th>Prescribed Standard</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>CO (Carbon Monoxide)</td>
                                    <td>{data.coLevel} %</td>
                                    <td>0.5 %</td>
                                </tr>
                                <tr>
                                    <td>HC (Hydrocarbons)</td>
                                    <td>{data.hcLevel} ppm</td>
                                    <td>4500 ppm</td>
                                </tr>
                                <tr>
                                    <td>High Idling CO</td>
                                    <td>{data.highIdlingCO || '-'}</td>
                                    <td>-</td>
                                </tr>
                                <tr>
                                    <td>Smoke Density</td>
                                    <td>{data.smokeDensity || '-'}</td>
                                    <td>-</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="cert-footer">
                    <p>This certificate is computer generated and does not require a signature.</p>
                </div>
            </div>
        </div>
    );
}
