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

// Function to get sidebar items based on user role
export const getSidebarItems = (role) => {
    // Common items for all roles
    const commonItems = [
        {
            title: 'Home',
            path: '/',
            icon: <AiIcons.AiFillHome />,
            cName: 'nav-text'
        },
        {
            title: 'Dashboard',
            path: role === 'ADMIN' ? '/admin-dashboard' : '/treasurer-dashboard',
            icon: <MdIcons.MdDashboard />,
            cName: 'nav-text'
        }
    ];

    // Role-specific items
    if (role === 'TREASURER') {
        return [
            ...commonItems,
            {
                title: 'Budget Form',
                path: '/budgets/new',
                icon: <FaIcons.FaWpforms />,
                cName: 'nav-text'
            },
            {
                title: 'My Budget Requests',
                path: '/budgets',
                icon: <FaIcons.FaListAlt />,
                cName: 'nav-text'
            }
        ];
    } else if (role === 'ADMIN') {
        return [
            ...commonItems,
            {
                title: 'Pending Requests',
                path: '/admin/pending-requests',
                icon: <FaIcons.FaClock />,
                cName: 'nav-text'
            },
            {
                title: 'All Requests',
                path: '/budgets',
                icon: <FaIcons.FaListAlt />,
                cName: 'nav-text'
            },
            {
                title: 'Monthly Reports',
                path: '/admin/reports/monthly',
                icon: <FaIcons.FaChartBar />,
                cName: 'nav-text'
            },
            {
                title: 'Create Account',
                path: '/admin/create-user',
                icon: <FaIcons.FaUserPlus />,
                cName: 'nav-text'
            }
        ];
    }

    // Default items (if no role or unknown role)
    return commonItems;
};

// Keep old export for backward compatibility (defaults to TREASURER view)
export const Sidebar = getSidebarItems('TREASURER');