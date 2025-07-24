import React, { useState, useEffect } from 'react';
import { Button, NavDropdown } from 'react-bootstrap';
import { FaUserCircle, FaPlus, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import CreateGroupModal from './CreateGroupModal';
import './GroupList.css';

const GroupList = ({ onSelectGroup, selectedGroupId }) => {
  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get('/groups');
        setGroups(response.data);
      } catch (error) {
        console.error('Failed to fetch groups', error);
      }
    };

    if (currentUser) {
      fetchGroups();
    }
  }, [currentUser]);

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
