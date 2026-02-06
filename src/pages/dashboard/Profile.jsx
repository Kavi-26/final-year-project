import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './Profile.css';

export default function Profile() {
    const { currentUser, userRole } = useAuth();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser) return;

            try {
                let collectionName = 'users'; // Default
                if (userRole === 'admin') collectionName = 'admins'; // Might not exist if relying on hardcoded check, but good to have.
                if (userRole === 'staff') collectionName = 'staff';

                // Fallback logic from AuthContext suggests checking multiple if unsure, 
                // but usually userRole is reliable here. 
                // However, our AuthContext fetchUserRole checks 'admins', 'staff', 'users'.

                // Let's try to fetch based on role, or fallback to 'users' if role is 'user'
                if (userRole === 'admin') {
                    // Admins might not have a doc in 'admins' collection if handled differently, 
                    // but context checks 'admins' first.
                    // If purely hardcoded email, we might not have a doc.
                    // Let's assume most have a doc or we show auth info.
                }

                const docRef = doc(db, collectionName, currentUser.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                } else {
                    // If no doc found (e.g. hardcoded admin), use Auth details
                    setUserData({
                        name: currentUser.displayName || 'Administrator',
                        email: currentUser.email,
                        role: userRole,
                        createdAt: currentUser.metadata.creationTime
                    });
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [currentUser, userRole]);

    if (loading) return <div className="loading-spinner">Loading Profile...</div>;

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>My Profile</h1>
                <p>Manage your account settings and preferences.</p>
            </div>

            <div className="profile-card">
                <div className="profile-avatar">
                    {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                </div>

                <div className="profile-details-grid">
                    <div className="detail-item">
                        <label>Full Name</label>
                        <div className="value">{userData?.name || 'N/A'}</div>
                    </div>

                    <div className="detail-item">
                        <label>Email Address</label>
                        <div className="value">{userData?.email || currentUser?.email}</div>
                    </div>

                    <div className="detail-item">
                        <label>Account Role</label>
                        <div className="value capitalize">{userRole}</div>
                    </div>

                    <div className="detail-item">
                        <label>Member Since</label>
                        <div className="value">
                            {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>

                    <div className="detail-item">
                        <label>User ID</label>
                        <div className="value code">{currentUser?.uid}</div>
                    </div>

                    <div className="detail-item">
                        <label>Status</label>
                        <div className="value">
                            <span className={`status-badge ${userData?.isActive ? 'pass' : 'fail'}`}>
                                {userData?.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
