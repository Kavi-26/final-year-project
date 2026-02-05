import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, getSecondaryAuth } from "../firebase";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";

const logSession = async (uid, action) => {
    try {
        await addDoc(collection(db, "activity_logs"), {
            uid,
            action, // 'login', 'logout', 'upload_cert', etc.
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent
        });
    } catch (e) {
        console.error("Failed to log session", e);
    }
};

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'admin', 'staff', 'user'
    const [loading, setLoading] = useState(true);

    // Helper to check role across collections
    const fetchUserRole = async (uid, email) => {
        // 0. Hardcoded Super Admin (Failsafe)
        if (email === 'anbuemission@gmail.com' || email === 'anbutest@gmail.com') return 'admin';

        // 1. Check Admin
        const adminDoc = await getDoc(doc(db, "admins", uid));
        if (adminDoc.exists()) return "admin";

        // 2. Check Staff
        const staffDoc = await getDoc(doc(db, "staff", uid));
        if (staffDoc.exists()) return "staff";

        // 3. Check User
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) return "user";

        return null; // Unknown role
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);
            try {
                if (user) {
                    const role = await fetchUserRole(user.uid, user.email);
                    setUserRole(role);
                    setCurrentUser(user);
                } else {
                    setUserRole(null);
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
                setUserRole(null);
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await logSession(result.user.uid, 'login');
        return result;
    };

    const signup = async (email, password, name) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Create user document
        await setDoc(doc(db, "users", result.user.uid), {
            name,
            email,
            role: "user",
            isActive: true,
            useraction: true,
            createdAt: new Date().toISOString()
        });
        await logSession(result.user.uid, 'signup');
        return result;
    };

    // Admin creating a staff account
    const createStaff = async (email, password, name) => {
        const secondaryAuth = getSecondaryAuth();
        const result = await createUserWithEmailAndPassword(secondaryAuth, email, password);

        // Create staff document in main DB
        await setDoc(doc(db, "staff", result.user.uid), {
            name,
            email,
            role: "staff",
            isActive: true,
            staffaction: true,
            createdAt: new Date().toISOString()
        });

        // Force sign out the secondary user so it doesn't interfere
        await signOut(secondaryAuth);
        return result;
    };

    // Admin creating a user account (Same logic as staff creation but for 'users' role)
    const createUserByAdmin = async (email, password, name) => {
        const secondaryAuth = getSecondaryAuth();
        const result = await createUserWithEmailAndPassword(secondaryAuth, email, password);

        // Create user document in main DB
        await setDoc(doc(db, "users", result.user.uid), {
            name,
            email,
            role: "user",
            isActive: true,
            useraction: true,
            createdAt: new Date().toISOString()
        });

        // Force sign out the secondary user so it doesn't interfere
        await signOut(secondaryAuth);
        return result;
    };

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        currentUser,
        userRole,
        login,
        signup,
        createStaff,
        createUserByAdmin,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
