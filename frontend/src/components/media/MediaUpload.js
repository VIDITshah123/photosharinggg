import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../../services/api';

const MediaUpload = ({ groupId, onUploadSuccess }) => {
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('media', file);

    try {
      await api.post(`/media/upload/${groupId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Notify parent component that upload was successful
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Failed to upload media', error);
    }
  }, [groupId, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className="dropzone mt-4">
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p>Drop the files here ...</p> :
          <p>Drag 'n' drop some files here, or click to select files</p>
      }
    </div>
  );
};

export default MediaUpload;
