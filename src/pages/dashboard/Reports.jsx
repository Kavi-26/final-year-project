import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Reports.css';

export default function Reports() {
    const { currentUser, userRole } = useAuth();
    const [tests, setTests] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        result: 'all',
        vehicleType: 'all',
        fuelType: 'all'
    });
    const [activePeriod, setActivePeriod] = useState('all');

    useEffect(() => {
        const fetchReports = async () => {
            try {
                let testsRef = collection(db, "pollution_tests");
                let snapshot;
                
                // If user, we need to filter. Firestore 'or' queries are tricky, 
                // so we fetch and filter in memory or get user profile first.
                snapshot = await getDocs(testsRef);

                const getDate = (dateField) => {
                    if (!dateField) return new Date(0);
                    if (typeof dateField.toDate === 'function') return dateField.toDate();
                    return new Date(dateField);
                };

                let data = snapshot.docs.map(doc => {
                    const docData = doc.data();
                    const testDate = getDate(docData.testDate || docData.createdAt);
                    return {
                        id: doc.id,
                        ...docData,
                        date: testDate
                    };
                });

                if (userRole === 'user') {
                    const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userSnap.exists()) {
                        const uData = userSnap.data();
                        data = data.filter(t => 
                            t.ownerName?.toLowerCase() === uData.name?.toLowerCase() ||
                            t.vehicleNumber?.toUpperCase() === uData.vehicleNumber?.toUpperCase()
                        );
                    } else {
                        data = []; // No profile, no data
                    }
                }

                data.sort((a, b) => b.date - a.date);
                setTests(data);
                setFiltered(data);
            } catch (err) {
                console.error("Error fetching reports:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [currentUser, userRole]);

    useEffect(() => {
        let res = tests;
        if (filters.result !== 'all') {
            res = res.filter(t => t.testResult === filters.result);
        }
        if (filters.vehicleType && filters.vehicleType !== 'all') {
            res = res.filter(t => t.vehicleType === filters.vehicleType);
        }
        if (filters.fuelType && filters.fuelType !== 'all') {
            res = res.filter(t => t.fuelType === filters.fuelType);
        }
        if (filters.startDate) {
            const startStr = filters.startDate;
            res = res.filter(t => {
                const d = t.date.toISOString().split('T')[0];
                return d >= startStr;
            });
        }
        if (filters.endDate) {
            const endStr = filters.endDate;
            res = res.filter(t => {
                const d = t.date.toISOString().split('T')[0];
                return d <= endStr;
            });
        }
        setFiltered(res);
    }, [filters, tests]);

    const handlePeriodChange = (period) => {
        setActivePeriod(period);
        const now = new Date();
        const formatDate = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if (period === 'all') {
            setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
        } else if (period === 'today') {
            const todayStr = formatDate(now);
            setFilters(prev => ({ ...prev, startDate: todayStr, endDate: todayStr }));
        } else if (period === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            setFilters(prev => ({ ...prev, startDate: formatDate(startOfMonth), endDate: formatDate(now) }));
        } else if (period === 'year') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            setFilters(prev => ({ ...prev, startDate: formatDate(startOfYear), endDate: formatDate(now) }));
        }
    };

    const handleDownloadCSV = () => {
        if (filtered.length === 0) {
            alert("No data to download");
            return;
        }

        const headers = [
            'Test Date', 'Certificate ID', 'Vehicle Number', 'Owner Name', 
            'Vehicle Type', 'Fuel Type', 'CO Level (%)', 'HC Level (ppm)', 
            'Result', 'Validity Date'
        ];

        const csvRows = [headers.join(",")];

        filtered.forEach(t => {
            const row = [
                t.date.toLocaleDateString(),
                t.id,
                t.vehicleNumber.toUpperCase(),
                t.ownerName,
                t.vehicleType,
                t.fuelType,
                t.coLevel || '0',
                t.hcLevel || '0',
                t.testResult,
                t.validityDate ? new Date(t.validityDate).toLocaleDateString() : 'N/A'
            ].map(val => {
                const str = String(val);
                // Simple escaping: if includes comma, wrap in quotes
                if (str.includes(',')) return `"${str.replace(/"/g, '""')}"`;
                return str;
            });
            csvRows.push(row.join(","));
        });

        const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Pollution_Reports_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text("Pollution Test Reports", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total Records: ${filtered.length}`, 14, 36);

        const tableColumn = ["Date", "Vehicle No", "Type", "Owner", "Status", "CO (%)"];
        const tableRows = [];

        filtered.forEach(t => {
            const rowData = [
                t.date.toLocaleDateString(),
                t.vehicleNumber.toUpperCase(),
                t.vehicleType,
                t.ownerName,
                t.testResult,
                t.coLevel || '0'
            ];
            tableRows.push(rowData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        doc.save(`Pollution_Reports_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="reports-container">
            <div className="reports-header">
                <div className="header-left">
                    <h1>Test Reports</h1>
                    <p className="subtitle">Analyze and manage emission test records</p>
                </div>
                <div className="download-actions">
                    <button className="btn-download csv" onClick={handleDownloadCSV}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        CSV
                    </button>
                    <button className="btn-download pdf" onClick={handleDownloadPDF}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        PDF
                    </button>
                </div>
            </div>

            <div className="filters-card">
                <div className="period-tabs">
                    {['all', 'today', 'month', 'year'].map(p => (
                        <button
                            key={p}
                            className={`period-tab ${activePeriod === p ? 'active' : ''}`}
                            onClick={() => handlePeriodChange(p)}
                        >
                            {p === 'all' ? 'All Time' : p === 'month' ? 'This Month' : p === 'year' ? 'This Year' : 'Today'}
                        </button>
                    ))}
                </div>

                <div className="filters-grid">
                    <div className="filter-group">
                        <label>Status</label>
                        <select
                            className="filter-select"
                            value={filters.result}
                            onChange={e => setFilters({ ...filters, result: e.target.value })}
                        >
                            <option value="all">All Status</option>
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Vehicle Type</label>
                        <select
                            className="filter-select"
                            value={filters.vehicleType}
                            onChange={e => setFilters({ ...filters, vehicleType: e.target.value })}
                        >
                            <option value="all">All Vehicles</option>
                            <option value="bike">Bike</option>
                            <option value="car">Car</option>
                            <option value="auto">Auto</option>
                            <option value="truck">Truck</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Fuel Type</label>
                        <select
                            className="filter-select"
                            value={filters.fuelType}
                            onChange={e => setFilters({ ...filters, fuelType: e.target.value })}
                        >
                            <option value="all">All Fuels</option>
                            <option value="petrol">Petrol</option>
                            <option value="diesel">Diesel</option>
                            <option value="cng">CNG</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>From Date</label>
                        <input
                            type="date"
                            className="filter-input"
                            value={filters.startDate}
                            onChange={e => {
                                setFilters({ ...filters, startDate: e.target.value });
                                setActivePeriod('custom');
                            }}
                        />
                    </div>
                    <div className="filter-group">
                        <label>To Date</label>
                        <input
                            type="date"
                            className="filter-input"
                            value={filters.endDate}
                            onChange={e => {
                                setFilters({ ...filters, endDate: e.target.value });
                                setActivePeriod('custom');
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="reports-table-container">
                <div className="table-header-info">
                    <span>Found <strong>{filtered.length}</strong> test records</span>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Test Date</th>
                                <th>Vehicle No</th>
                                <th>Type</th>
                                <th>Owner</th>
                                <th>Status</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="table-loader">Loading records...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" className="table-empty">No records found for the selected filters.</td></tr>
                            ) : (
                                filtered.map(t => (
                                    <tr key={t.id} className="table-row-hover">
                                        <td className="font-medium">{t.date.toLocaleDateString()}</td>
                                        <td className="uppercase font-bold text-primary">{t.vehicleNumber}</td>
                                        <td className="capitalize">{t.vehicleType}</td>
                                        <td>{t.ownerName}</td>
                                        <td>
                                            <span className={`status-badge ${t.testResult?.toLowerCase()}`}>
                                                {t.testResult}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <a href={`/certificate/${t.id}`} className="btn-view-cert" target="_blank" rel="noreferrer">
                                                View Cert
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
