import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GroupList from '../components/groups/GroupList';
import GroupDetails from '../components/groups/GroupDetails';
import './GroupsPage.css';

const GroupsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedGroupId, setSelectedGroupId] = useState(id);
  const [groups, setGroups] = useState([]);

  const handleSelectGroup = (groupId) => {
    setSelectedGroupId(groupId);
    navigate(`/groups/${groupId}`);
  };

  const handleGroupAction = (action, groupId) => {
    if (action === 'leave' || action === 'delete') {
      setGroups(prevGroups => prevGroups.filter(g => g.id !== groupId));
      setSelectedGroupId(null);
    }
  };

  return (
    <div className="groups-page-container">
      <div className="groups-list-panel">
        <GroupList groups={groups} setGroups={setGroups} onSelectGroup={handleSelectGroup} selectedGroupId={selectedGroupId} />
      </div>
      <div className="group-details-panel">
        {selectedGroupId ? (
          <GroupDetails key={selectedGroupId} group={groups.find(g => g.id === selectedGroupId)} onGroupAction={handleGroupAction} />
        ) : (
          <div className="no-group-selected">
            <h2>WhatsApp Web</h2>
            <p>Send and receive messages without keeping your phone online.<br/>Use WhatsApp on up to 4 linked devices and 1 phone at the same time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;
