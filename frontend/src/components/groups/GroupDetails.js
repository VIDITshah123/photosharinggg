import React, { useState, useEffect } from 'react';
import { NavDropdown, Modal, Button } from 'react-bootstrap';
import { FaUserCircle, FaSignOutAlt, FaTrash } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import api from '../../services/api';
import MediaList from '../media/MediaList';
import MediaUpload from '../media/MediaUpload';
import './GroupDetails.css';

const GroupDetails = ({ group, onMediaUploaded, onGroupAction }) => {
  const [media, setMedia] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (group) {
      api.get(`/media/${group.id}`)
        .then(response => setMedia(response.data))
        .catch(error => console.error('Failed to fetch media', error));
    }
  }, [group]);

  const handleMediaUploaded = (newMedia) => {
    setMedia(prevMedia => [...prevMedia, newMedia]);
    if(onMediaUploaded) onMediaUploaded(newMedia);
  };

  const handleLeaveGroup = async () => {
    try {
      await api.post(`/groups/${group.id}/leave`);
      setShowLeaveModal(false);
      onGroupAction('leave', group.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to leave group.');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await api.delete(`/groups/${group.id}`);
      setShowDeleteModal(false);
      onGroupAction('delete', group.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete group.');
    }
  };

  if (!group) {
    return <div className="group-details-placeholder">Select a group to see the conversation</div>;
  }

  return (
    <div className="group-details-container">
      <div className="group-details-header">
        <div className="group-header-info">
          <FaUserCircle size="2.5rem" className="me-3" />
          <span className="group-header-title">{group.name}</span>
        </div>
        <div className="group-header-actions">
          <NavDropdown title={<BsThreeDotsVertical size="1.5rem" color="#54656f" />} id="group-actions-dropdown" align="end" className="group-actions-dropdown">
            <NavDropdown.Item onClick={() => setShowLeaveModal(true)}>
              <FaSignOutAlt className="me-2" /> Leave Group
            </NavDropdown.Item>
            <NavDropdown.Item onClick={() => setShowDeleteModal(true)} className="text-danger">
              <FaTrash className="me-2" /> Delete Group
            </NavDropdown.Item>
          </NavDropdown>
        </div>
      </div>
      <div className="group-details-body">
        <MediaList media={media} />
      </div>
      <div className="group-footer">
        <MediaUpload groupId={group.id} onMediaUploaded={handleMediaUploaded} />
      </div>

      {/* Leave Group Modal */}
      <Modal show={showLeaveModal} onHide={() => { setShowLeaveModal(false); setError(''); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Leave Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to leave "{group.name}"?
          {error && <p className="text-danger mt-2">{error}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowLeaveModal(false); setError(''); }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLeaveGroup}>
            Leave
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Group Modal */}
      <Modal show={showDeleteModal} onHide={() => { setShowDeleteModal(false); setError(''); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete "{group.name}"? This action cannot be undone.
          {error && <p className="text-danger mt-2">{error}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setError(''); }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteGroup}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GroupDetails;
