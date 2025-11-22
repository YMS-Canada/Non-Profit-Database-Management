// Import React (needed for JSX in the icon fields)
import React from 'react';
// Import all FontAwesome icons as FaIcons (used for budget and dashboard icons)
import * as FaIcons from 'react-icons/fa';
// Import all Ant Design icons as AiIcons (used for some sidebar icons)
import * as AiIcons from 'react-icons/ai';
// Import all Ionicons as IoIcons (used for some sidebar icons)
import * as IoIcons from 'react-icons/io';
// Import Material Design icons for better variety
import * as MdIcons from 'react-icons/md';

// Export an array called Sidebar, which contains objects for each sidebar menu item
export const Sidebar = [
    {
        // The label shown in the sidebar
        title: 'Home',
        // The route path to navigate to when this item is clicked
        path: '/',
        // The icon displayed next to the title (Ant Design Home icon)
        icon: <AiIcons.AiFillHome />,
        // The CSS class name for styling this menu item
        cName: 'nav-text'
    },
    {
        title: 'Admin',
        // Use the SPA admin dashboard route to avoid colliding with Django's /admin/ URL
        path: '/admin-dashboard',
        // Material Design Admin Panel icon
        icon: <MdIcons.MdAdminPanelSettings />,
        cName: 'nav-text'
    },
    {
        title: 'Budget Form',
        path: '/form',
        // FontAwesome Dollar Sign icon (budget-related)
        icon: <FaIcons.FaWpforms />,
        cName: 'nav-text'
    },
    {
        title: 'My Budget Requests',
        path: '/budgets',                // 👈 this matches your route
        icon: <FaIcons.FaListAlt />,     // pick whatever icon you like
        cName: 'nav-text'
    },
    {
        title: 'Dashboard',
        path: '/dashboard',
        // Material Design Dashboard icon
        icon: <MdIcons.MdDashboard />,
        cName: 'nav-text'
    }
    // You can add more menu items here by adding more objects to this array
]