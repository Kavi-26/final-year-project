import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import './VehicleList.css';

export default function AddVehicle() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        regNo: '',
        model: '',
        type: 'Car',
        fuelType: 'Petrol'
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await addDoc(collection(db, "vehicles"), {
                ...formData,
                userId: auth.currentUser.uid, // Link to current user
                createdAt: serverTimestamp()
            });
            navigate('/dashboard/vehicles');
        } catch (error) {
            console.error("Error adding vehicle:", error);
            alert("Failed to add vehicle");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="add-vehicle-container">
            <h2>Register New Vehicle</h2>
            <form onSubmit={handleSubmit} className="vehicle-form">
                <div className="form-group">
                    <label>Registration Number</label>
                    <input
                        type="text"
                        name="regNo"
                        value={formData.regNo}
                        onChange={handleChange}
                        placeholder="e.g. TN-01-AB-1234"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Brand / Model</label>
                    <input
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        placeholder="e.g. Honda City"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Vehicle Type</label>
                    <select name="type" value={formData.type} onChange={handleChange}>
                        <option value="Bike">Bike</option>
                        <option value="Car">Car</option>
                        <option value="Auto">Auto Rickshaw</option>
                        <option value="Truck">Truck</option>
                        <option value="Bus">Bus</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Fuel Type</label>
                    <select name="fuelType" value={formData.fuelType} onChange={handleChange}>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="CNG">CNG</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                    </select>
                </div>

                <button type="submit" className="btn-save" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Vehicle'}
                </button>
            </form>
        </div>
    );
}
