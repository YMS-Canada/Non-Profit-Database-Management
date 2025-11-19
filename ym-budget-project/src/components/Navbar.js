import React, {useState} from 'react'; // Import React and useState hook for state management
import * as FaIcons from 'react-icons/fa'; // Import all FontAwesome icons as FaIcons
import * as AiIcons from 'react-icons/ai'; // Import all Ant Design icons as AiIcons
import { Link } from 'react-router-dom'; // Import Link for client-side navigation
import {Sidebar} from './Sidebar'; // Import Sidebar data (menu items)
import './Navbar.css'; // Import CSS for Navbar styling
import { IconContext } from 'react-icons'; // Import IconContext to set icon properties globally

function Navbar() {
    const [sidebar, setSidebar] = useState(false); // State to track if sidebar is open

    const showSidebar = () => setSidebar(!sidebar); // Toggle sidebar open/close

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
                {Sidebar.map((item, index) => {
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