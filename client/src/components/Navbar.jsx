import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🌳 Family Tree</Link>
      </div>
      <div className="navbar-menu">
        {user ? (
          <>
            <Link to="/dashboard" className="nav-link">My Trees</Link>
            <Link to="/join" className="nav-link">Join Tree</Link>
            <span className="nav-user">Hi, {user.name}</span>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
