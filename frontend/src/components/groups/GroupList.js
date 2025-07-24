import React, { useState, useEffect } from 'react';
import { Button, NavDropdown } from 'react-bootstrap';
import { FaArrowLeft, FaUserCircle, FaPlus, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import CreateGroupModal from './CreateGroupModal';
import './GroupList.css';

const GroupList = ({ groups, setGroups, onSelectGroup, selectedGroupId }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get('/groups');
        const sortedGroups = response.data.sort((a, b) => a.name.localeCompare(b.name));
        setGroups(sortedGroups);
      } catch (error) {
        console.error('Failed to fetch groups', error);
      }
    };

    fetchGroups();
  }, [setGroups]);

  const handleGroupCreated = (newGroup) => {
    setGroups([...groups, newGroup].sort((a, b) => a.name.localeCompare(b.name)));
    setShowCreateModal(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="group-list-container">
      <div className="group-list-header">
        <Button variant="link" className="back-btn" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft size="1.5rem" color="#54656f" />
        </Button>
        <div className="header-icons-right">
          <NavDropdown
            title={<FaUserCircle size="2.5rem" color="#54656f" />}
            id="profile-dropdown"
            className="profile-dropdown"
          >
            <NavDropdown.Item onClick={handleLogout}>
              <FaSignOutAlt className="me-2" /> Logout
            </NavDropdown.Item>
          </NavDropdown>
          <Button variant="link" className="create-group-btn" onClick={() => setShowCreateModal(true)}>
            <FaPlus />
          </Button>
        </div>
      </div>
      <div className="list-group">
        {groups.map((group) => (
          <div
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            className={`list-group-item list-group-item-action ${
              selectedGroupId === group.id ? 'active' : ''
            }`}>
            <div className="group-item-avatar">
              <FaUserCircle size="3rem" color="#dfe5e7" />
            </div>
            <div className="group-item-info">
              <div className="group-item-name">{group.name}</div>
              <div className="group-item-last-message">
                Click to view media
              </div>
            </div>
          </div>
        ))}
      </div>
      <CreateGroupModal
        show={showCreateModal}
        handleClose={() => setShowCreateModal(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
};

export default GroupList;
