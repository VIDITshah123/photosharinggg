import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import api from '../../services/api';

const CreateGroupModal = ({ show, handleClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    if (show) {
      // Fetch all users to populate the members selection
      api.get('/users')
        .then(response => {
          setUsers(response.data);
        })
        .catch(error => {
          console.error('Failed to fetch users', error);
        });
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/groups', {
        name: groupName,
        description: groupDescription,
        members: selectedUsers,
      });
      onGroupCreated(response.data);
      setGroupName('');
      setGroupDescription('');
      setSelectedUsers([]);
      handleClose();
    } catch (error) {
      console.error('Failed to create group', error);
    }
  };

  const handleUserSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedUsers(selectedOptions);
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Create New Group</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Group Name</Form.Label>
            <Form.Control
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Add Members</Form.Label>
            <Form.Control
              as="select"
              multiple
              value={selectedUsers}
              onChange={handleUserSelection}
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
          <Button variant="primary" type="submit">
            Create Group
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreateGroupModal;
