import React from 'react';
import { FaFileVideo, FaDownload } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import './MediaList.css';

const MediaList = ({ media }) => {
  const { currentUser } = useAuth();

  const handleDownload = async (mediaId, fileName) => {
    try {
      const response = await api.get(`/media/download/${mediaId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download media', error);
    }
  };

  return (
    <div className="media-list-container">
      {media.map((item) => {
        const isSender = item.user_id === currentUser?.id;
        const mediaUrl = `${api.defaults.baseURL}/media/download/${item.id}`;

        return (
          <div
            key={item.id}
            className={`chat-message ${isSender ? 'sent' : 'received'}`}>
            <div className="message-bubble">
              {!isSender && (
                <div className="message-sender">{item.sender_name}</div>
              )}
              <div className="message-content">
                {item.file_type.startsWith('image/') ? (
                  <img src={mediaUrl} alt={item.file_name} className="img-fluid" />
                ) : (
                  <div className="video-placeholder">
                    <FaFileVideo size="3em" />
                    <p>{item.file_name}</p>
                  </div>
                )}
              </div>
              <div className="message-footer">
                <span className="message-time">
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button onClick={() => handleDownload(item.id, item.file_name)} className="download-btn">
                  <FaDownload />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MediaList;
