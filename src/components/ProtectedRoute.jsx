import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser, userRole } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // If role is not yet loaded, maybe show loading spinner?
        // For now assuming role is loaded with user.
        // If we want to be strict, we might need a separate 'roleLoading' state in AuthContext.
        // But since we await the firestore fetch in AuthContext, userRole should be available if currentUser is available
        // unless the fetch failed or role is missing.

        // Fallback: redirects to home if unauthorized
        return <Navigate to="/" />;
    }

    return children;
}
