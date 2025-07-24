const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../../modules/authentication/backend');

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// POST /api/media/upload/:groupId - Upload media to a group
router.post('/upload/:groupId', authenticateToken, upload.single('media'), (req, res) => {
  const userId = req.user.user.id;
  const groupId = req.params.groupId;
  const db = req.app.locals.db;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Check if user is a member of the group
  const checkMemberSql = 'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?';
  db.get(checkMemberSql, [groupId, userId], (err, member) => {
    if (err) {
      console.error('Error checking group membership:', err.message);
      return res.status(500).json({ error: 'Failed to verify group membership' });
    }
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Save file info to the database
    const { filename, path: filePath, mimetype } = req.file;
    const insertMediaSql = 'INSERT INTO media (group_id, user_id, file_name, file_path, file_type) VALUES (?, ?, ?, ?, ?)';
    db.run(insertMediaSql, [groupId, userId, filename, filePath, mimetype], function(err) {
      if (err) {
        console.error('Error saving media info to database:', err.message);
        return res.status(500).json({ error: 'Failed to save media information' });
      }
      res.status(201).json({ message: 'File uploaded successfully', mediaId: this.lastID });
    });
  });
});

// GET /api/media/:groupId - Get all media for a group
router.get('/:groupId', authenticateToken, (req, res) => {
  const userId = req.user.user.id;
  const groupId = req.params.groupId;
  const db = req.app.locals.db;

  // Check if user is a member of the group
  const checkMemberSql = 'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?';
  db.get(checkMemberSql, [groupId, userId], (err, member) => {
    if (err) {
      console.error('Error checking group membership:', err.message);
      return res.status(500).json({ error: 'Failed to verify group membership' });
    }
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Fetch all media for the group
    const getMediaSql = 'SELECT id, file_name, file_type, uploaded_at FROM media WHERE group_id = ?';
    db.all(getMediaSql, [groupId], (err, media) => {
      if (err) {
        console.error('Error fetching media:', err.message);
        return res.status(500).json({ error: 'Failed to fetch media' });
      }
      res.json(media);
    });
  });
});

// GET /api/media/download/:mediaId - Download a media file
router.get('/download/:mediaId', authenticateToken, (req, res) => {
  const userId = req.user.user.id;
  const mediaId = req.params.mediaId;
  const db = req.app.locals.db;

  // Get media info and verify user is a member of the group
  const sql = `
    SELECT m.file_path, m.file_name, gm.role
    FROM media m
    JOIN group_members gm ON m.group_id = gm.group_id
    WHERE m.id = ? AND gm.user_id = ?
  `;
  db.get(sql, [mediaId, userId], (err, row) => {
    if (err) {
      console.error('Error fetching media for download:', err.message);
      return res.status(500).json({ error: 'Failed to fetch media' });
    }
    if (!row) {
      return res.status(403).json({ error: 'You do not have permission to download this file' });
    }

    res.download(row.file_path, row.file_name, (err) => {
      if (err) {
        console.error('Error downloading file:', err.message);
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  });
});

module.exports = router;
