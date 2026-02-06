
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import './Staff.css'; // Reusing Staff styles for consistency

export default function Users() {
    const { userRole, createUserByAdmin } = useAuth();
    const [dataList, setDataList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', vehicleNumber: '', mobileNumber: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const list = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            setDataList(list);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setIsAdding(false);
        setError('');
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (userRole !== 'admin') return;

        setError('');
        try {
            await createUserByAdmin(formData.email, formData.password, formData.name, formData.vehicleNumber, formData.mobileNumber);
            alert("User account created successfully!");

            setFormData({ name: '', email: '', password: '', vehicleNumber: '', mobileNumber: '' });
            setIsAdding(false);
            fetchData(); // Refresh list
        } catch (err) {
            console.error(err);
            setError(err.message || "Error creating account");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete the record from the database.")) return;
        try {
            await deleteDoc(doc(db, 'users', id));
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Failed to delete record");
        }
    };

    if (userRole !== 'admin') {
        return <div className="p-4">Access Denied: Admins only.</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="dashboard-title">User Management</h2>
                    <p style={{ color: '#64748b' }}>Manage registered users and their details.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
                    {isAdding ? 'Cancel' : '+ Add New User'}
                </button>
            </div>

            {isAdding && (
                <div className="filters-card" style={{ maxWidth: '800px', margin: '0 auto 2rem auto', background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h3 className="form-title" style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: '700' }}>Create New User Account</h3>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Full Name</label>
                            <input className="filter-input" style={{ width: '100%' }} name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Email Address</label>
                            <input className="filter-input" style={{ width: '100%' }} name="email" type="email" placeholder="user@example.com" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Vehicle Number</label>
                            <input className="filter-input" style={{ width: '100%', textTransform: 'uppercase' }} name="vehicleNumber" placeholder="TN-01-AB-1234" value={formData.vehicleNumber} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Mobile Number</label>
                            <input className="filter-input" style={{ width: '100%' }} name="mobileNumber" placeholder="9876543210" value={formData.mobileNumber} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Password</label>
                            <input className="filter-input" style={{ width: '100%' }} name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                Create Account
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</div> : (
                <div className="table-container" style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Name / Contact</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Vehicle</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Role</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Joined</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataList.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No records found</td></tr>
                            ) : dataList.map(item => (
                                <tr key={item.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.name || 'N/A'}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.email}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.mobileNumber}</div>
                                    </td>
                                    <td style={{ padding: '1rem', textTransform: 'uppercase', fontWeight: '500' }}>{item.vehicleNumber || '-'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className="badge badge-user" style={{ background: '#ebfdf5', color: '#059669', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600' }}>
                                            {item.role || 'user'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#64748b' }}>
                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button onClick={() => handleDelete(item.id)} className="btn-delete" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
