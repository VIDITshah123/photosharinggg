import React, { useState, useEffect, useCallback } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import api from '../../services/api';
import MediaList from '../media/MediaList';
import MediaUpload from '../media/MediaUpload';
import './GroupDetails.css';

const GroupDetails = ({ groupId }) => {
  const [group, setGroup] = useState(null);
  const [media, setMedia] = useState([]);

  const fetchGroupAndMedia = useCallback(async () => {
    if (!groupId) return;
    try {
      const [groupResponse, mediaResponse] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/media/${groupId}`),
      ]);
      setGroup(groupResponse.data);
      setMedia(mediaResponse.data);
    } catch (error) {
      console.error('Failed to fetch group details or media', error);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupAndMedia();
  }, [groupId, fetchGroupAndMedia]);

  const handleUploadSuccess = () => {
    // Re-fetch media list after a successful upload
    fetchGroupAndMedia();
  };

  if (!group) {
    return <div>Loading...</div>;
  }

  return (
    <div className="group-details-container">
      <div className="group-details-header">
        <div className="group-header-avatar">
          <FaUserCircle size="2.5rem" color="#dfe5e7" />
        </div>
        <div className="group-header-info">
          <h2>{group.name}</h2>
        </div>
      </div>
      <div className="group-details-body">
        <MediaList media={media} />
      </div>
      <div className="group-details-footer">
        <MediaUpload groupId={groupId} onUploadSuccess={handleUploadSuccess} />
      </div>
    </div>
  );
};

export default GroupDetails;
