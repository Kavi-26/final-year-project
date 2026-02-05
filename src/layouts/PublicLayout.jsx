import { Outlet, Link, useNavigate } from "react-router-dom";

export default function PublicLayout() {
    const navigate = useNavigate();

    return (
        <div className="public-layout">
            <nav className="navbar">
                <div className="container navbar-content">
                    <div
                        className="brand"
                        onClick={() => navigate('/login', { state: { adminMode: true } })}
                        style={{ cursor: 'pointer' }}
                    >
                        ANBU Emission Test
                    </div>
                    <div className="nav-links">
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/about" className="nav-link">About</Link>
                        <Link to="/contact" className="nav-link">Contact</Link>
                        <Link to="/verify" className="nav-link">Verify</Link>
                    </div>
                </div>
            </nav>
            <main className="page-content">
                <Outlet />
            </main>
        </div>
    );
}
