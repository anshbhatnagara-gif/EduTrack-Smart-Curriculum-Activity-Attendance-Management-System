const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcement.controller');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

router.use(authenticate);

router.get('/', announcementController.getAnnouncements);

// Write routes locked to admin and teacher roles
router.post('/', authorizeRoles('teacher', 'admin'), announcementController.createAnnouncement);
router.put('/:id', authorizeRoles('teacher', 'admin'), announcementController.updateAnnouncement);
router.delete('/:id', authorizeRoles('teacher', 'admin'), announcementController.deleteAnnouncement);

module.exports = router;
