import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Link } from 'react-router-dom';
import './VehicleList.css'; // Will create this next

export default function VehicleList() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        if (!auth.currentUser) return;
        try {
            const q = query(
                collection(db, "vehicles"),
                where("userId", "==", auth.currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() // expects regNo, model, fuelType, type, etc.
            }));
            setVehicles(data);
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this vehicle?")) return;
        try {
            await deleteDoc(doc(db, "vehicles", id));
            setVehicles(prev => prev.filter(v => v.id !== id));
        } catch (error) {
            console.error("Error deleting vehicle:", error);
        }
    };

    if (loading) return <div className="loading">Loading vehicles...</div>;

    return (
        <div className="vehicle-list-container">
            <div className="header-actions">
                <h2>My Vehicles</h2>
                <Link to="/dashboard/add-vehicle" className="btn-add">
                    + Add Vehicle
                </Link>
            </div>

            {vehicles.length === 0 ? (
                <div className="empty-state">
                    <p>No vehicles registered yet.</p>
                </div>
            ) : (
                <div className="vehicles-grid">
                    {vehicles.map(vehicle => (
                        <div key={vehicle.id} className="vehicle-card">
                            <div className="vehicle-icon">
                                {vehicle.type === 'Bike' ? '🏍️' :
                                    vehicle.type === 'Car' ? '🚗' :
                                        vehicle.type === 'Truck' ? '🚚' : '🚙'}
                            </div>
                            <div className="vehicle-info">
                                <h3>{vehicle.regNo}</h3>
                                <p className="model">{vehicle.model}</p>
                                <span className="badge fuel">{vehicle.fuelType}</span>
                                <span className="badge type">{vehicle.type}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(vehicle.id)}
                                className="btn-delete"
                                aria-label="Delete vehicle"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
