import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
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
            res = res.filter(t => t.date >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59);
            res = res.filter(t => t.date <= end);
        }
        setFiltered(res);
    }, [filters, tests]);

    const handleDownload = () => {
        // Simple CSV export
        const headers = ["Test ID", "Date", "Vehicle No", "Owner", "Role", "Result"];
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + filtered.map(row =>
                `${row.id},${row.date.toLocaleDateString()},${row.vehicleNumber},${row.ownerName},${row.testResult}`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "pollution_reports.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="reports-container">
            <div className="reports-header">
                <h1>Test Reports</h1>
                <div className="download-actions">
                    <button className="btn-download" onClick={handleDownload}>
                        ⬇ Download CSV
                    </button>
                </div>
            </div>

            <div className="filters-card">
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
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div className="filter-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            className="filter-input"
                            value={filters.endDate}
                            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="reports-table-container">
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
