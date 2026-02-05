import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

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
                const q = query(collection(db, "pollution_tests"), orderBy("testDate", "desc"));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: doc.data().testDate ? doc.data().testDate.toDate() : new Date(0)
                }));
                setTests(data);
                setFiltered(data);
            } catch (err) {
                console.error(err);
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
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2>Test Reports</h2>
                <button className="btn btn-primary" onClick={handleDownload}>Download CSV</button>
            </div>

            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Status</label>
                        <select
                            value={filters.result}
                            onChange={e => setFilters({ ...filters, result: e.target.value })}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="all">All</option>
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Vehicle Type</label>
                        <select
                            value={filters.vehicleType}
                            onChange={e => setFilters({ ...filters, vehicleType: e.target.value })}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="all">All</option>
                            <option value="bike">Bike</option>
                            <option value="car">Car</option>
                            <option value="auto">Auto</option>
                            <option value="truck">Truck</option>
                            <option value="bus">Bus</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Fuel Type</label>
                        <select
                            value={filters.fuelType}
                            onChange={e => setFilters({ ...filters, fuelType: e.target.value })}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="all">All</option>
                            <option value="petrol">Petrol</option>
                            <option value="diesel">Diesel</option>
                            <option value="cng">CNG</option>
                            <option value="electric">Electric</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Start Date</label>
                        <input type="date" onChange={e => setFilters({ ...filters, startDate: e.target.value })} style={{ padding: '0.4rem' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>End Date</label>
                        <input type="date" onChange={e => setFilters({ ...filters, endDate: e.target.value })} style={{ padding: '0.4rem' }} />
                    </div>
                </div>
            </div>

            <div className="table-responsive" style={{ background: 'white', borderRadius: '8px' }}>
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
                        {filtered.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>No data found</td></tr> :
                            filtered.map(t => (
                                <tr key={t.id}>
                                    <td>{t.date.toLocaleDateString()}</td>
                                    <td style={{ textTransform: 'uppercase' }}>{t.vehicleNumber}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{t.vehicleType}</td>
                                    <td>{t.ownerName}</td>
                                    <td>
                                        <span className={`status-badge ${t.testResult?.toLowerCase()}`}>
                                            {t.testResult}
                                        </span>
                                    </td>
                                    <td><a href={`/certificate/${t.id}`} target="_blank" rel="noreferrer">View</a></td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
}
