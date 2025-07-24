import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUsers } from 'react-icons/fa';

const Sidebar = ({ collapsed }) => {
  const location = useLocation();

  const menuItems = [
    {
      name: 'Groups',
      path: '/groups',
      icon: <FaUsers />,
    },
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`} style={{
      width: collapsed ? '70px' : '250px',
      minHeight: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: '#343a40',
      transition: 'width 0.3s',
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
      padding: '20px 0',
      zIndex: 1030
    }}>
      <div className="d-flex justify-content-center align-items-center py-3 mb-4" style={{ color: '#fff' }}>
        {!collapsed && <h4 className="m-0">EmployDEX</h4>}
        {collapsed && <h4 className="m-0">E</h4>}
      </div>
      <ul className="nav flex-column">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);

          return (
            <li
              key={item.name}
              className="nav-item mb-2"
              title={collapsed ? item.name : ''}
            >
              <Link
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={{
                  color: isActive ? '#fff' : '#ced4da',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  padding: collapsed ? '10px 0' : '10px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: '4px',
                  margin: '0 10px',
                  transition: 'all 0.3s'
                }}
              >
                <span className="me-2">{item.icon}</span>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto text-center p-3" style={{ color: '#6c757d', fontSize: '0.8rem' }}>
        {!collapsed && <span>EmployDEX &copy; 2025</span>}
      </div>
    </div>
  );
};

export default Sidebar;
