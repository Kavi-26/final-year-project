import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './Reports.css';

export default function Notifications() {
    const { currentUser, userRole } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                let testsRef = collection(db, 'pollution_tests');
                let snapshot;

                if (userRole === 'user') {
                    const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userSnap.exists()) {
                        const uData = userSnap.data();
                        const qVehicle = query(testsRef, where('vehicleNumber', '==', uData.vehicleNumber?.toUpperCase() || ''));
                        snapshot = await getDocs(qVehicle);
                    } else {
                        snapshot = { docs: [] };
                    }
                } else {
                    snapshot = await getDocs(testsRef);
                }

                const getDate = (dateField) => {
                    if (!dateField) return new Date(0);
                    if (typeof dateField.toDate === 'function') return dateField.toDate();
                    return new Date(dateField);
                };

                const data = snapshot.docs.map(doc => {
                    const docData = doc.data();
                    return {
                        id: doc.id,
                        ...docData,
                        parsedValidityDate: getDate(docData.validityDate)
                    };
                });

                // Generate messages based on validity
                const now = new Date();
                const oneWeekFromNow = new Date();
                oneWeekFromNow.setDate(now.getDate() + 7);

                const generatedMessages = [];
                data.forEach(test => {
                    const expiry = test.parsedValidityDate;
                    if (!expiry || expiry.getTime() === 0) return;

                    if (expiry < now) {
                        generatedMessages.push({
                            id: `exp-${test.id}`,
                            type: 'critical',
                            title: 'Test Expired',
                            text: `The emission test record for ${test.vehicleNumber.toUpperCase()} expired on ${expiry.toLocaleDateString()}. Please book a new test immediately to stay compliant.`,
                            date: expiry,
                            vehicle: test.vehicleNumber
                        });
                    } else if (expiry <= oneWeekFromNow) {
                        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                        generatedMessages.push({
                            id: `warn-${test.id}`,
                            type: 'warning',
                            title: 'Expirations Soon',
                            text: `Your vehicle ${test.vehicleNumber.toUpperCase()}'s emission test will expire in ${daysLeft} days (${expiry.toLocaleDateString()}).`,
                            date: expiry,
                            vehicle: test.vehicleNumber
                        });
                    }
                });

                // Sort by date (latest/most urgent first)
                generatedMessages.sort((a, b) => {
                    if (a.type === 'critical' && b.type !== 'critical') return -1;
                    if (b.type === 'critical' && a.type !== 'critical') return 1;
                    return a.date - b.date;
                });

                setMessages(generatedMessages);
            } catch (err) {
                console.error("Error fetching notifications:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [currentUser, userRole]);

    return (
        <div className="reports-container">
            <div className="reports-header" style={{ marginBottom: '2rem' }}>
                <div className="header-left">
                    <h1>Notifications</h1>
                    <p className="subtitle">Persistent updates and alerts for your vehicles</p>
                </div>
            </div>

            <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading ? (
                    <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        Checking for updates...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', background: 'white' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
                        <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>No New Messages</h3>
                        <p style={{ color: '#64748b' }}>You're all caught up! No upcoming expirations detected.</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className={`glass-card notification-item ${msg.type}`} style={{ 
                            padding: '1.5rem', 
                            background: 'white', 
                            borderLeft: `5px solid ${msg.type === 'critical' ? '#ef4444' : '#f59e0b'}`,
                            display: 'flex',
                            gap: '1.5rem',
                            alignItems: 'flex-start',
                            animation: 'slideIn 0.4s ease-out'
                        }}>
                            <div className="msg-icon" style={{ 
                                fontSize: '1.5rem', 
                                background: msg.type === 'critical' ? '#fee2e2' : '#fff9db',
                                width: '50px',
                                height: '50px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {msg.type === 'critical' ? '🚫' : '⚠️'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{msg.title}</h3>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{msg.date.toLocaleDateString()}</span>
                                </div>
                                <p style={{ margin: '0 0 1rem 0', color: '#475569', lineHeight: '1.5' }}>{msg.text}</p>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <Link to="/dashboard/reports" className="btn-download csv" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Check Data</Link>
                                    <button className="btn-download pdf" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => window.open('/contact', '_blank')}>Contact Center</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
