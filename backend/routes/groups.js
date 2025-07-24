const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../../modules/authentication/backend');

// POST /api/groups - Create a new group
router.post('/', authenticateToken, [
  body('name').notEmpty().withMessage('Group name is required'),
  body('description').optional().isString(),
  body('members').optional().isArray().withMessage('Members must be an array of user IDs'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, members } = req.body;
  const created_by = req.user.user.id;
  const db = req.app.locals.db;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION;');

    const groupSql = 'INSERT INTO groups (name, description, created_by) VALUES (?, ?, ?)';
    db.run(groupSql, [name, description, created_by], function(err) {
      if (err) {
        console.error('Error creating group:', err.message);
        return db.run('ROLLBACK;', () => res.status(500).json({ error: 'Failed to create group' }));
      }

      const groupId = this.lastID;

      // Add creator as admin
      const adminMemberSql = 'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)';
      db.run(adminMemberSql, [groupId, created_by, 'admin'], (err) => {
        if (err) {
          console.error('Error adding admin to group:', err.message);
          return db.run('ROLLBACK;', () => res.status(500).json({ error: 'Failed to add admin to group' }));
        }

        // Filter out the creator from the members list to avoid adding them twice
        const otherMembers = members ? members.filter(id => String(id) !== String(created_by)) : [];

        if (otherMembers.length > 0) {
          const memberPlaceholders = otherMembers.map(() => '(?, ?, ?)').join(',');
          const memberValues = [];
          otherMembers.forEach(userId => {
            memberValues.push(groupId, userId, 'member');
          });

          const addMembersSql = `INSERT INTO group_members (group_id, user_id, role) VALUES ${memberPlaceholders}`;
          db.run(addMembersSql, memberValues, function(err) {
            if (err) {
              console.error('Error adding members to group:', err.message);
              return db.run('ROLLBACK;', () => res.status(500).json({ error: 'Failed to add members to group' }));
            }
            commitTransaction(groupId);
          });
        } else {
          commitTransaction(groupId);
        }
      });
    });

    const commitTransaction = (groupId) => {
      db.run('COMMIT;', (err) => {
        if (err) {
          console.error('Error committing transaction:', err.message);
          return db.run('ROLLBACK;', () => res.status(500).json({ error: 'Failed to commit group creation' }));
        }
        res.status(201).json({ message: 'Group created successfully', group: { id: groupId, name, description } });
      });
    };
  });
});

// GET /api/groups - Get all groups for the logged-in user
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.user.id;
  const db = req.app.locals.db;

  const sql = `
    SELECT g.id, g.name, g.description, g.created_at
    FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = ?
  `;

  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching groups:', err.message);
      return res.status(500).json({ error: 'Failed to fetch groups' });
    }
    res.json(rows);
  });
});

// GET /api/groups/:id - Get a single group's details
router.get('/:id', authenticateToken, (req, res) => {
  const userId = req.user.user.id;
  const groupId = req.params.id;
  const db = req.app.locals.db;

  // First, check if the user is a member of the group
  const checkMemberSql = 'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?';
  db.get(checkMemberSql, [groupId, userId], (err, member) => {
    if (err) {
      console.error('Error checking group membership:', err.message);
      return res.status(500).json({ error: 'Failed to verify group membership' });
    }
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // If the user is a member, fetch group details and members
    const groupSql = 'SELECT id, name, description, created_at FROM groups WHERE id = ?';
    db.get(groupSql, [groupId], (err, group) => {
      if (err) {
        console.error('Error fetching group details:', err.message);
        return res.status(500).json({ error: 'Failed to fetch group details' });
      }
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const membersSql = `
        SELECT u.user_id as id, u.first_name, u.last_name, gm.role
        FROM users_master u
        JOIN group_members gm ON u.user_id = gm.user_id
        WHERE gm.group_id = ?
      `;
      db.all(membersSql, [groupId], (err, members) => {
        if (err) {
          console.error('Error fetching group members:', err.message);
          return res.status(500).json({ error: 'Failed to fetch group members' });
        }
        res.json({ ...group, members });
      });
    });
  });
});

// POST /api/groups/:id/members - Add a member to a group
router.post('/:id/members', authenticateToken, [body('user_id').notEmpty().withMessage('User ID is required')], (req, res) => {
  const adminId = req.user.user.id;
  const groupId = req.params.id;
  const { user_id: newMemberId } = req.body;
  const db = req.app.locals.db;

  // Check if the authenticated user is an admin of the group
  const checkAdminSql = 'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?';
  db.get(checkAdminSql, [groupId, adminId], (err, admin) => {
    if (err) {
      console.error('Error checking admin status:', err.message);
      return res.status(500).json({ error: 'Failed to verify admin status' });
    }
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can add members' });
    }

    // Add the new member to the group
    const addMemberSql = 'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)';
    db.run(addMemberSql, [groupId, newMemberId, 'member'], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'User is already a member of this group' });
        }
        console.error('Error adding member to group:', err.message);
        return res.status(500).json({ error: 'Failed to add member to group' });
      }
      res.status(201).json({ message: 'Member added successfully' });
    });
  });
});

// DELETE /api/groups/:id/members/:userId - Remove a member from a group
router.delete('/:id/members/:userId', authenticateToken, (req, res) => {
  const adminId = req.user.user.id;
  const { id: groupId, userId: memberToRemoveId } = req.params;
  const db = req.app.locals.db;

  // Check if the authenticated user is an admin of the group
  const checkAdminSql = 'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?';
  db.get(checkAdminSql, [groupId, adminId], (err, admin) => {
    if (err) {
      console.error('Error checking admin status:', err.message);
      return res.status(500).json({ error: 'Failed to verify admin status' });
    }
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can remove members' });
    }

    // Prevent admin from removing themselves if they are the last admin
    if (String(adminId) === String(memberToRemoveId)) {
      const countAdminsSql = 'SELECT COUNT(*) as adminCount FROM group_members WHERE group_id = ? AND role = \'admin\'';
      db.get(countAdminsSql, [groupId], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to count admins' });
        }
        if (result.adminCount <= 1) {
          return res.status(400).json({ error: 'Cannot remove the last admin of the group' });
        }
        proceedWithRemoval();
      });
    } else {
      proceedWithRemoval();
    }

    function proceedWithRemoval() {
      const removeMemberSql = 'DELETE FROM group_members WHERE group_id = ? AND user_id = ?';
      db.run(removeMemberSql, [groupId, memberToRemoveId], function(err) {
        if (err) {
          console.error('Error removing member from group:', err.message);
          return res.status(500).json({ error: 'Failed to remove member' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Member not found in this group' });
        }
        res.json({ message: 'Member removed successfully' });
      });
    }
  });
});

// POST /api/groups/:id/leave - Leave a group
router.post('/:id/leave', authenticateToken, (req, res) => {
  const userId = req.user.user.id;
  const groupId = req.params.id;
  const db = req.app.locals.db;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const getMemberSql = 'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?';
    db.get(getMemberSql, [groupId, userId], (err, member) => {
      if (err) {
        return db.run('ROLLBACK', () => res.status(500).json({ error: 'Database error checking membership' }));
      }
      if (!member) {
        return db.run('ROLLBACK', () => res.status(404).json({ error: 'You are not a member of this group' }));
      }

      const getCountsSql = `
        SELECT
          COUNT(*) as memberCount,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as adminCount
        FROM group_members WHERE group_id = ?
      `;
      db.get(getCountsSql, [groupId], (err, counts) => {
        if (err) {
          return db.run('ROLLBACK', () => res.status(500).json({ error: 'Database error counting members' }));
        }

        if (member.role === 'admin' && counts.adminCount === 1 && counts.memberCount > 1) {
          return db.run('ROLLBACK', () => res.status(400).json({ error: 'You are the last admin. Please promote another member before leaving.' }));
        }

        const leaveSql = 'DELETE FROM group_members WHERE group_id = ? AND user_id = ?';
        db.run(leaveSql, [groupId, userId], function(err) {
          if (err) {
            return db.run('ROLLBACK', () => res.status(500).json({ error: 'Failed to leave the group' }));
          }
          db.run('COMMIT', () => res.json({ message: 'Successfully left the group' }));
        });
      });
    });
  });
});

// DELETE /api/groups/:id - Delete a group
router.delete('/:id', authenticateToken, (req, res) => {
  const userId = req.user.user.id;
  const groupId = req.params.id;
  const db = req.app.locals.db;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const getMembersSql = 'SELECT user_id FROM group_members WHERE group_id = ?';
    db.all(getMembersSql, [groupId], (err, members) => {
      if (err) {
        return db.run('ROLLBACK', () => res.status(500).json({ error: 'Database error fetching members' }));
      }

      if (members.length > 1) {
        return db.run('ROLLBACK', () => res.status(400).json({ error: 'Cannot delete a group with other members in it.' }));
      }

      if (members.length === 0 || String(members[0].user_id) !== String(userId)) {
        return db.run('ROLLBACK', () => res.status(403).json({ error: 'You do not have permission to delete this group.' }));
      }

      // Proceed with deletion
      const deleteMediaSql = 'DELETE FROM media WHERE group_id = ?';
      db.run(deleteMediaSql, [groupId], (err) => {
        if (err) {
          return db.run('ROLLBACK', () => res.status(500).json({ error: 'Failed to delete group media' }));
        }
        const deleteMembersSql = 'DELETE FROM group_members WHERE group_id = ?';
        db.run(deleteMembersSql, [groupId], (err) => {
          if (err) {
            return db.run('ROLLBACK', () => res.status(500).json({ error: 'Failed to delete group members' }));
          }
          const deleteGroupSql = 'DELETE FROM groups WHERE id = ?';
          db.run(deleteGroupSql, [groupId], (err) => {
            if (err) {
              return db.run('ROLLBACK', () => res.status(500).json({ error: 'Failed to delete the group' }));
            }
            db.run('COMMIT', () => res.json({ message: 'Group deleted successfully' }));
          });
        });
      });
    });
  });
});

module.exports = router;
