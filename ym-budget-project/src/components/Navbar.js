import React, { useState, useEffect } from 'react'; // Import React and useState hook for state management
import * as FaIcons from 'react-icons/fa'; // Import all FontAwesome icons as FaIcons
import * as AiIcons from 'react-icons/ai'; // Import all Ant Design icons as AiIcons
import { Link, useNavigate } from 'react-router-dom'; // Import Link for client-side navigation
import { getSidebarItems } from './Sidebar'; // Import Sidebar function
import './Navbar.css'; // Import CSS for Navbar styling
import { IconContext } from 'react-icons'; // Import IconContext to set icon properties globally
import { logout } from '../lib/api';

function Navbar() {
    const [sidebar, setSidebar] = useState(false); // State to track if sidebar is open
    const [user, setUser] = useState(null);
    const [sidebarItems, setSidebarItems] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is logged in
        const checkUser = () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                    // Set sidebar items based on user role
                    setSidebarItems(getSidebarItems(userData.role));
                } catch (e) {
                    localStorage.removeItem('user');
                    setUser(null);
                    setSidebarItems(getSidebarItems(null));
                }
            } else {
                setUser(null);
                setSidebarItems(getSidebarItems(null));
            }
        };
        
        checkUser();
        
        // Listen for storage changes (login/logout in other tabs)
        window.addEventListener('storage', checkUser);
        
        return () => window.removeEventListener('storage', checkUser);
    }, []);

    const showSidebar = () => setSidebar(!sidebar); // Toggle sidebar open/close

    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
            navigate('/login');
        } catch (err) {
            console.error('Logout error:', err);
            // Still clear local state and redirect
            localStorage.removeItem('user');
            setUser(null);
            navigate('/login');
        }
    };

    return (
    <>
    {/* Set all icons inside to have white color */}
    <IconContext.Provider value={{ color: '#fff' }}>
        {/* Top navbar with menu icon */}
        <div className="navbar">
            <Link to="#" className="menu-bars">
                {/* Hamburger menu icon, opens sidebar on click */}
                <FaIcons.FaBars onClick={showSidebar} />
            </Link>
            
            {/* Auth section in navbar */}
            <div className="navbar-auth">
                {user ? (
                    <>
                        <span className="user-name">👤 {user.name}</span>
                        <button onClick={handleLogout} className="auth-button">
                            Logout
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="auth-button">
                        Login
                    </Link>
                )}
            </div>
        </div>
        {/* Sidebar navigation, active class when sidebar is open */}
        <nav className={sidebar ? 'nav-menu active' : 'nav-menu'} >
            {/* Sidebar menu items, clicking closes sidebar */}
            <ul className='nav-menu-items' onClick={showSidebar}>
                {/* Close (X) icon at top of sidebar */}
                <li className="navbar-toggle">
                    <Link to="#" className="menu-bars close-icon">
                        <AiIcons.AiOutlineClose />
                    </Link>
                </li>
                {/* Render each sidebar item from Sidebar data */}
                {sidebarItems.map((item, index) => {
                    return (
                        <li key={index} className={item.cName}>
                            <Link to={item.path}>
                                {item.icon}
                                <span>{item.title}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
        </IconContext.Provider>
    </>
    )
}

export default Navbar; //