
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import './Staff.css'; // Reusing Staff styles for consistency

export default function Users() {
    const { userRole, createUserByAdmin } = useAuth();
    const [dataList, setDataList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
            await createUserByAdmin(formData.email, formData.password, formData.name);
            alert("User account created successfully!");

            setFormData({ name: '', email: '', password: '' });
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
            <div className="dashboard-header">
                <h2 className="dashboard-title">User Management</h2>
            </div>

            <div className="action-bar">
                <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
                    {isAdding ? 'Cancel' : 'Add New User'}
                </button>
            </div>

            {isAdding && (
                <div className="form-container">
                    <h3 className="form-title">Create New User Account</h3>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleAdd} className="staff-form">
                        <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
                        <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
                        <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                        <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>
                            Create User Account
                        </button>
                    </form>
                </div>
            )}

            {loading ? <div>Loading...</div> : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataList.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No records found</td></tr>
                            ) : dataList.map(item => (
                                <tr key={item.id}>
                                    <td>{item.name || 'N/A'}</td>
                                    <td>{item.email}</td>
                                    <td>
                                        <span className="badge badge-user">
                                            {item.role || 'user'}
                                        </span>
                                    </td>
                                    <td>
                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td>
                                        <button onClick={() => handleDelete(item.id)} className="btn-delete">Remove</button>
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
