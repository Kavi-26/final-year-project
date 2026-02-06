import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function PublicLayout() {
    return (
        <div className="public-layout">
            <Navbar />
            <main className="page-content" style={{ paddingTop: '80px' }}>
                <Outlet />
            </main>
        </div>
    );
}

