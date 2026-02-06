import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import VehicleList from './VehicleList';
import './Home.css';
import './Reports.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardHome() {
    const { currentUser, userRole } = useAuth();
    const [allTests, setAllTests] = useState([]); // Store all raw data
    const [activePeriod, setActivePeriod] = useState('all');

    // Display stats
    const [stats, setStats] = useState({
        totalTests: 0,
        passCount: 0,
        failCount: 0,
        todayTests: 0 // Keep this as a fixed metric or dynamic? Let's make it dynamic based on period.
    });

    const [chartData, setChartData] = useState({
        vehicleType: [],
        fuelType: [],
        passFail: []
    });

    const [recentTests, setRecentTests] = useState([]);
    const [loading, setLoading] = useState(true);

    // If regular user, show only their vehicle list
    if (userRole === 'user') {
        return (
            <div className="dashboard-home">
                <header className="page-header">
                    <h1>User Dashboard</h1>
                    <p>Welcome back, {currentUser?.displayName || currentUser?.email}</p>
                </header>
                <VehicleList />
            </div>
        );
    }

    // 1. Fetch All Data Once
    useEffect(() => {
        const fetchData = async () => {
            try {
                const testsRef = collection(db, 'pollution_tests');
                const snapshot = await getDocs(testsRef);

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
                        parsedDate: getDate(docData.testDate || docData.createdAt)
                    };
                });

                // Sort by date descending
                data.sort((a, b) => b.parsedDate - a.parsedDate);
                setAllTests(data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 2. Filter and Calculate Stats when Period or Data changes
    useEffect(() => {
        if (loading) return;

        const now = new Date();
        let filtered = allTests;

        // Apply Time Filter
        if (activePeriod === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            filtered = allTests.filter(t => t.parsedDate.toISOString().split('T')[0] === todayStr);
        } else if (activePeriod === 'month') {
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            filtered = allTests.filter(t =>
                t.parsedDate.getMonth() === currentMonth &&
                t.parsedDate.getFullYear() === currentYear
            );
        } else if (activePeriod === 'year') {
            const currentYear = now.getFullYear();
            filtered = allTests.filter(t => t.parsedDate.getFullYear() === currentYear);
        }

        // Calculate Stats
        let total = 0;
        let pass = 0;
        let fail = 0;

        // Also calculate "Today" specifically for the 4th card if we want it to stay fixed, 
        // OR we can change the 4th card to something else. 
        // Let's make the 4th card "Tests (Current Period)" vs "Total Lifetime" ?
        // Or simpler: Just update all stats to reflect the period. 
        // But users might still want to see "Today's Activity" regardless of the main filter? 
        // Let's stick to: The Dashboard shows data for the SELECTED period.

        const typeCount = {};
        const fuelCount = {};

        filtered.forEach(data => {
            total++;
            if (data.testResult === 'Pass') pass++;
            if (data.testResult === 'Fail') fail++;

            const vType = data.vehicleType || 'Unknown';
            const fType = data.fuelType || 'Unknown';
            typeCount[vType] = (typeCount[vType] || 0) + 1;
            fuelCount[fType] = (fuelCount[fType] || 0) + 1;
        });

        // 4th Card logic: If filter is 'all', show Today's count. 
        // If filter is 'today', it's same as Total.
        // If filter is 'month', it's tests this month.
        // Let's repurpose the 4th card based on text.

        // Calculate a separate "Tests Today" count just for reference?
        // Let's just pass 'total' as the main metric.
        // And maybe the 4th card can be 'Avg Compliance' or something? 
        // For now, let's keep the structure but update values. 

        // Let's calculate 'Tests Today' regardless of filter for the 4th card, 
        // providing a stable "Live" metric.
        const todayStr = now.toISOString().split('T')[0];
        const testsTodayCount = allTests.filter(t => t.parsedDate.toISOString().split('T')[0] === todayStr).length;


        setStats({
            totalTests: total,
            passCount: pass,
            failCount: fail,
            todayTests: testsTodayCount
        });

        // Charts
        const vTypeData = Object.keys(typeCount).map(k => ({ name: k, value: typeCount[k] }));
        const fuelData = Object.keys(fuelCount).map(k => ({ name: k, value: fuelCount[k] }));
        const passFailData = [
            { name: 'Pass', value: pass },
            { name: 'Fail', value: fail }
        ];

        setChartData({ vehicleType: vTypeData, fuelType: fuelData, passFail: passFailData });
        setRecentTests(filtered.slice(0, 5));

    }, [activePeriod, allTests, loading]);

    return (
        <div className="dashboard-home">
            <header className="page-header">
                <h1>Dashboard Overview</h1>
                <p>Welcome back, {currentUser.email} | Role: <span className="badge">{userRole || 'Staff'}</span></p>
            </header>

            {/* Reuse period-tabs style from Reports.css (imported) */}
            <div className="period-tabs">
                <button
                    className={`period-tab ${activePeriod === 'all' ? 'active' : ''}`}
                    onClick={() => setActivePeriod('all')}
                >
                    All Time
                </button>
                <button
                    className={`period-tab ${activePeriod === 'today' ? 'active' : ''}`}
                    onClick={() => setActivePeriod('today')}
                >
                    Today
                </button>
                <button
                    className={`period-tab ${activePeriod === 'month' ? 'active' : ''}`}
                    onClick={() => setActivePeriod('month')}
                >
                    This Month
                </button>
                <button
                    className={`period-tab ${activePeriod === 'year' ? 'active' : ''}`}
                    onClick={() => setActivePeriod('year')}
                >
                    This Year
                </button>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Tests</h3>
                    <div className="stat-value">{stats.totalTests}</div>
                    <div className="stat-sub">{activePeriod === 'all' ? 'Lifetime tests' : 'In selected period'}</div>
                </div>
                <div className="stat-card success">
                    <h3>Passed</h3>
                    <div className="stat-value">{stats.passCount}</div>
                    <div className="stat-sub">Vehicles cleared</div>
                </div>
                <div className="stat-card danger">
                    <h3>Failed</h3>
                    <div className="stat-value">{stats.failCount}</div>
                    <div className="stat-sub">Needs attention</div>
                </div>
                <div className="stat-card info">
                    <h3>Today's Activity</h3>
                    <div className="stat-value">{stats.todayTests}</div>
                    <div className="stat-sub">Tests run today</div>
                </div>
            </div>

            {/* Analytics Charts */}
            <div className="charts-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                <div className="chart-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#1e293b' }}>Pass vs Fail</h3>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.passFail} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                                    {chartData.passFail.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Fail' ? '#ef4444' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#1e293b' }}>Vehicle Types</h3>
                    <div style={{ height: 300 }}>
                        {chartData.vehicleType.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData.vehicleType}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.vehicleType.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 500 }}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                No data available
                            </div>
                        )}
                    </div>
                </div>

                <div className="chart-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#1e293b' }}>Fuel Types</h3>
                    <div style={{ height: 300 }}>
                        {chartData.fuelType.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData.fuelType}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.fuelType.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 500 }}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                No data available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-section">
                <h2>{activePeriod === 'all' ? 'Recent Tests' : 'Tests in Period'}</h2>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Vehicle No</th>
                                <th>Owner</th>
                                <th>Type</th>
                                <th>Result</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTests.length === 0 ? (
                                <tr><td colSpan="6" className="text-center">No tests recorded in this period.</td></tr>
                            ) : (
                                recentTests.map(test => (
                                    <tr key={test.id}>
                                        <td>{test.parsedDate ? test.parsedDate.toLocaleDateString() : 'N/A'}</td>
                                        <td className="uppercase">{test.vehicleNumber}</td>
                                        <td>{test.ownerName}</td>
                                        <td className="capitalize">{test.vehicleType}</td>
                                        <td>
                                            <span className={`status-badge ${test.testResult?.toLowerCase()}`}>
                                                {test.testResult}
                                            </span>
                                        </td>
                                        <td>
                                            <a href={`/certificate/${test.id}`} className="btn-link">View</a>
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
