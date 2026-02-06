import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import './Reports.css';

export default function Reports() {
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
                // Fetch from correct collection
                const q = query(collection(db, "pollution_tests"));
                const snapshot = await getDocs(q);

                const getDate = (dateField) => {
                    if (!dateField) return new Date(0);
                    if (typeof dateField.toDate === 'function') return dateField.toDate();
                    return new Date(dateField);
                };

                const data = snapshot.docs.map(doc => {
                    const docData = doc.data();
                    const testDate = getDate(docData.testDate || docData.createdAt);
                    return {
                        id: doc.id,
                        ...docData,
                        date: testDate
                    };
                });

                // Sort by date descending
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
    }, []);

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
            // Compare removing time
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

    const handleDownload = () => {
        if (filtered.length === 0) {
            alert("No data to download");
            return;
        }

        // 1. Collect all unique keys
        const allKeys = new Set();
        filtered.forEach(item => {
            Object.keys(item).forEach(key => allKeys.add(key));
        });

        // 2. Define Headers (Prioritize important ones)
        let headers = Array.from(allKeys);
        headers.sort();
        const priorityFields = [
            'id', 'date', 'testDate', 'expiryDate', 'validityDate',
            'vehicleNumber', 'ownerName', 'mobileNumber',
            'testResult', 'vehicleType', 'fuelType'
        ];

        headers = [
            ...priorityFields.filter(field => headers.includes(field)),
            ...headers.filter(field => !priorityFields.includes(field))
        ];

        // 3. Helper: Format Dates to YYYY-MM-DD (Excel friendly)
        const formatDate = (dateVal) => {
            if (!dateVal) return '';
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0]; // YYYY-MM-DD
        };

        // 4. Helper: Escape CSV values
        const processValue = (key, value) => {
            if (value === null || value === undefined) return '';

            // Handle Dates
            if (value instanceof Date || (typeof value === 'object' && value.seconds)) {
                const dateObj = value.seconds ? new Date(value.seconds * 1000) : value;
                return formatDate(dateObj);
            }

            let strVal = String(value);

            // Handle Mobile Number & Vehicle Number to prevent Scientific Notation or leading zero loss
            // Excel Hack: ="value" forces text mode
            if (['mobileNumber', 'vehicleNumber', 'phone'].includes(key)) {
                return `="${strVal}"`;
            }

            // Standard CSV escaping
            if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
                strVal = `"${strVal.replace(/"/g, '""')}"`;
            }

            return strVal;
        };

        // 5. Generate CSV Rows
        const csvRows = [];
        csvRows.push(headers.join(",")); // Header row

        filtered.forEach(row => {
            const values = headers.map(header => processValue(header, row[header]));
            csvRows.push(values.join(","));
        });

        // 6. Download
        const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
        const link = document.createElement("a");
        link.setAttribute("href", csvContent);
        link.setAttribute("download", `pollution_reports_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="reports-container">
            <div className="reports-header">
                <div className="header-left">
                    <h1>Test Reports</h1>
                    <p className="subtitle">View and download vehicle test records</p>
                </div>
                <div className="download-actions">
                    <button className="btn-download" onClick={handleDownload}>
                        ⬇ Download CSV
                    </button>
                </div>
            </div>

            <div className="filters-card">
                {/* Time Period Quick Filters */}
                <div className="period-tabs">
                    <button
                        className={`period-tab ${activePeriod === 'all' ? 'active' : ''}`}
                        onClick={() => handlePeriodChange('all')}
                    >
                        All Time
                    </button>
                    <button
                        className={`period-tab ${activePeriod === 'today' ? 'active' : ''}`}
                        onClick={() => handlePeriodChange('today')}
                    >
                        Today
                    </button>
                    <button
                        className={`period-tab ${activePeriod === 'month' ? 'active' : ''}`}
                        onClick={() => handlePeriodChange('month')}
                    >
                        This Month
                    </button>
                    <button
                        className={`period-tab ${activePeriod === 'year' ? 'active' : ''}`}
                        onClick={() => handlePeriodChange('year')}
                    >
                        This Year
                    </button>
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
                            <option value="bus">Bus</option>
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
                            <option value="electric">Electric</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Start Date</label>
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
                        <label>End Date</label>
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
                    <span>Showing <strong>{filtered.length}</strong> records</span>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Vehicle</th>
                                <th>Type</th>
                                <th>Owner</th>
                                <th>Status</th>
                                <th>Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center" style={{ padding: '2rem' }}>Loading reports...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" className="text-center" style={{ padding: '2rem' }}>No matching records found.</td></tr>
                            ) : (
                                filtered.map(t => (
                                    <tr key={t.id}>
                                        <td>{t.date.toLocaleDateString()}</td>
                                        <td className="uppercase">{t.vehicleNumber}</td>
                                        <td className="capitalize">{t.vehicleType}</td>
                                        <td>{t.ownerName}</td>
                                        <td>
                                            <span className={`status-badge ${t.testResult?.toLowerCase()}`}>
                                                {t.testResult}
                                            </span>
                                        </td>
                                        <td>
                                            <a href={`/certificate/${t.id}`} className="btn-link" target="_blank" rel="noreferrer">
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
