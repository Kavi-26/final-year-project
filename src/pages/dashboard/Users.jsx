import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import './Reports.css'; // Reusing Reports styles for premium look

export default function Users() {
    const { userRole, createUserByAdmin } = useAuth();
    const [dataList, setDataList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', vehicleNumber: '', mobileNumber: '' });
    const [editingId, setEditingId] = useState(null);
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
            if (editingId) {
                // Update existing
                const userRef = doc(db, 'users', editingId);
                await updateDoc(userRef, {
                    name: formData.name,
                    vehicleNumber: formData.vehicleNumber,
                    mobileNumber: formData.mobileNumber
                });
                alert("User updated successfully!");
            } else {
                // Create new
                await createUserByAdmin(formData.email, formData.password, formData.name, formData.vehicleNumber, formData.mobileNumber);
                alert("User account created successfully!");
            }

            resetForm();
            fetchData();
        } catch (err) {
            console.error(err);
            setError(err.message || "Error processing request");
        }
    };

    const handleEdit = (user) => {
        setFormData({
            name: user.name || '',
            email: user.email,
            password: '••••••••', // Placeholder
            vehicleNumber: user.vehicleNumber || '',
            mobileNumber: user.mobileNumber || ''
        });
        setEditingId(user.id);
        setIsAdding(true);
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', vehicleNumber: '', mobileNumber: '' });
        setEditingId(null);
        setIsAdding(false);
        setError('');
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
        <div className="dashboard-container reports-container">
            <header className="reports-header" style={{ marginBottom: '2rem' }}>
                <div className="header-info">
                    <h1>User Management</h1>
                    <p>Manage and monitor customer accounts and their registered vehicles.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-download csv" onClick={() => setIsAdding(!isAdding)}>
                        {isAdding ? 'Close Form' : '+ Add New User'}
                    </button>
                </div>
            </header>

            {isAdding && (
                <div className="filters-card fade-in" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                            {editingId ? 'Edit User Details' : 'Create New User Account'}
                        </h2>
                        <button className="btn-link" onClick={resetForm}>Clear</button>
                    </div>

                    {error && <div className="error-message" style={{ color: '#ef4444', marginBottom: '1rem', background: '#fef2f2', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>}

                    <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div className="filter-group">
                            <label>Full Name</label>
                            <input className="filter-input" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="filter-group">
                            <label>Email Address</label>
                            <input className="filter-input" name="email" type="email" placeholder="user@example.com" value={formData.email} onChange={handleChange} required disabled={editingId} title={editingId ? "Email cannot be changed" : ""} />
                        </div>
                        <div className="filter-group">
                            <label>Vehicle Number</label>
                            <input className="filter-input uppercase" name="vehicleNumber" placeholder="TN-01-AB-1234" value={formData.vehicleNumber} onChange={handleChange} required />
                        </div>
                        <div className="filter-group">
                            <label>Mobile Number</label>
                            <input className="filter-input" name="mobileNumber" placeholder="9876543210" value={formData.mobileNumber} onChange={handleChange} required />
                        </div>
                        {!editingId && (
                            <div className="filter-group">
                                <label>Password</label>
                                <input className="filter-input" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                            </div>
                        )}
                        <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end', gridColumn: editingId ? 'auto' : 'span 1' }}>
                            <button type="submit" className="btn-download pdf" style={{ width: '100%', height: '42px', padding: 0 }}>
                                {editingId ? 'Update Account' : 'Register User'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="section-card table-section fade-in">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name / Contact</th>
                                <th>Vehicle</th>
                                <th className="text-center">Role</th>
                                <th>Joined</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="text-center">Loading users...</td></tr>
                            ) : dataList.length === 0 ? (
                                <tr><td colSpan="5" className="text-center">No users found.</td></tr>
                            ) : dataList.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{item.name || 'N/A'}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.email}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.mobileNumber}</div>
                                    </td>
                                    <td className="uppercase font-mono">{item.vehicleNumber || '-'}</td>
                                    <td className="text-center">
                                        <span className="status-badge pass" style={{ padding: '0.2rem 0.8rem' }}>
                                            {item.role || 'user'}
                                        </span>
                                    </td>
                                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</td>
                                    <td className="text-right">
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleEdit(item)} className="btn-link" style={{ fontSize: '0.9rem' }}>Edit</button>
                                            <button onClick={() => handleDelete(item.id)} className="btn-link" style={{ color: '#ef4444', fontSize: '0.9rem' }}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
