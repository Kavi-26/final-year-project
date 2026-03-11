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
            // 1. Get User Profile to find Name
            const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", auth.currentUser.email)));
            let userName = "";
            if (!userDoc.empty) {
                userName = userDoc.docs[0].data().name;
            }

            // 2. Fetch Manually Added Vehicles
            const vehiclesQuery = query(
                collection(db, "vehicles"),
                where("userId", "==", auth.currentUser.uid)
            );

            // 3. Fetch Vehicles from Pollution Tests (by Owner Name)
            let testsQuery = null;
            if (userName) {
                testsQuery = query(
                    collection(db, "pollution_tests"),
                    where("ownerName", "==", userName)
                );
            }

            const [vehiclesSnapshot, testsSnapshot] = await Promise.all([
                getDocs(vehiclesQuery),
                testsQuery ? getDocs(testsQuery) : Promise.resolve({ docs: [] })
            ]);

            // 4. Merge Data (Avoid Duplicates by Reg No)
            const vehicleMap = new Map();

            // Priority: Manually Added Vehicles
            vehiclesSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const regNo = data.regNo?.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (regNo) {
                    vehicleMap.set(regNo, { id: doc.id, ...data });
                }
            });

            // Add from Tests if not exists
            testsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const regNo = data.vehicleNumber?.toUpperCase().replace(/[^A-Z0-9]/g, '');

                if (regNo && !vehicleMap.has(regNo)) {
                    vehicleMap.set(regNo, {
                        id: doc.id, // Use test ID as vehicle ID for display
                        regNo: data.vehicleNumber,
                        model: data.vehicleType, // Fallback model to type
                        fuelType: data.fuelType,
                        type: data.vehicleType,
                        isFromTest: true // flag to identify source if needed
                    });
                }
            });

            setVehicles(Array.from(vehicleMap.values()));
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
