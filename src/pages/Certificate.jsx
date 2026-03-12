import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import QRCode from "react-qr-code";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './Certificate.css';

export default function Certificate() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const certificateRef = useRef();

    useEffect(() => {
        const fetchCert = async () => {
            try {
                // Try 'pollution_tests' first, then 'tests'
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
        const canvas = await html2canvas(element, { 
            scale: 3, // High quality
            useCORS: true,
            logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Pollution_Cert_${data?.vehicleNumber || id}.pdf`);
    };

    if (loading) return <div className="cert-loader">Preparing Certificate...</div>;
    if (!data) return <div className="cert-error">Certificate not found!</div>;

    const testDate = data.testDate ? new Date(data.testDate).toLocaleDateString() : 'N/A';
    const validityDate = data.validityDate ? new Date(data.validityDate).toLocaleDateString() : 'N/A';

    return (
        <div className="certificate-page-wrapper">
            <div className="no-print floating-actions">
                <button onClick={handleDownloadPDF} className="action-btn download">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Download PDF
                </button>
                <button onClick={() => window.print()} className="action-btn print">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    Print
                </button>
            </div>

            <div className="certificate-document" ref={certificateRef}>
                <div className="cert-border-double">
                    <div className="cert-header-section">
                        <div className="gov-seal">
                            {/* Simple SVG Seal Representing Authority */}
                            <svg width="60" height="60" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="2"/>
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="2,2"/>
                                <path d="M50 20 L55 35 L70 35 L58 45 L62 60 L50 50 L38 60 L42 45 L30 35 L45 35 Z" fill="#1e293b"/>
                            </svg>
                        </div>
                        <div className="header-text">
                            <h1>FORM 59</h1>
                            <h2>POLLUTION UNDER CONTROL CERTIFICATE</h2>
                            <p className="auth-note">Authorized by Ministry of Road Transport & Highways</p>
                        </div>
                        <div className="header-qr">
                            <QRCode value={window.location.href} size={70} />
                        </div>
                    </div>

                    <div className="cert-meta-info">
                        <div className="meta-row">
                            <div className="meta-box">
                                <label>Certificate Number</label>
                                <span>{id.toUpperCase()}</span>
                            </div>
                            <div className="meta-box">
                                <label>Date of Test</label>
                                <span>{testDate}</span>
                            </div>
                            <div className="meta-box highlight">
                                <label>Validity Date</label>
                                <span>{validityDate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="vehicle-details-grid">
                        <div className="detail-item">
                            <label>Registration No.</label>
                            <span className="reg-no">{data.vehicleNumber?.toUpperCase()}</span>
                        </div>
                        <div className="detail-item">
                            <label>Vehicle Class</label>
                            <span className="capitalize">{data.vehicleType}</span>
                        </div>
                        <div className="detail-item">
                            <label>Fuel Type</label>
                            <span className="capitalize">{data.fuelType}</span>
                        </div>
                        <div className="detail-item">
                            <label>Emission Norms</label>
                            <span>{data.emissionNorms || 'BS-VI'}</span>
                        </div>
                    </div>

                    <div className="emission-results-table">
                        <h3>Test Result: <span className={`result-tag ${data.testResult?.toLowerCase()}`}>{data.testResult}</span></h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Pollutant</th>
                                    <th>Measured Value</th>
                                    <th>Permissible Limit</th>
                                    <th>Unit</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Carbon Monoxide (CO)</td>
                                    <td className="center">{data.coLevel || '0.00'}</td>
                                    <td className="center">0.50</td>
                                    <td className="center">% Vol</td>
                                </tr>
                                <tr>
                                    <td>Hydrocarbons (HC)</td>
                                    <td className="center">{data.hcLevel || '0'}</td>
                                    <td className="center">4500</td>
                                    <td className="center">ppm</td>
                                </tr>
                                <tr>
                                    <td>High Idling CO</td>
                                    <td className="center">{data.highIdlingCO || 'N/A'}</td>
                                    <td className="center">-</td>
                                    <td className="center">% Vol</td>
                                </tr>
                                <tr>
                                    <td>Smoke Density</td>
                                    <td className="center">{data.smokeDensity || 'N/A'}</td>
                                    <td className="center">1.62</td>
                                    <td className="center">m-1</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="cert-footer-info">
                        <p>This certificate is valid across India. Please verify the QR code for authenticity.</p>
                        <div className="footer-sign-area">
                            <div className="sign-placeholder">
                                <p>Digitally Signed By</p>
                                <p className="sign-name">Anbu Emission Test Centre</p>
                                <p className="sign-date">{new Date(data.createdAt || Date.now()).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
