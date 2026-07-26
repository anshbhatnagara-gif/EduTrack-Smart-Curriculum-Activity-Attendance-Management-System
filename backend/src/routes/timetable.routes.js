const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetable.controller');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

router.use(authenticate);

router.get('/', timetableController.getTimetable);
router.get('/me', timetableController.getMyTimetable);

// Admin-only modifying paths
router.post('/', authorizeRoles('admin'), timetableController.createTimetableEntry);
router.put('/:id', authorizeRoles('admin'), timetableController.updateTimetableEntry);
router.delete('/:id', authorizeRoles('admin'), timetableController.deleteTimetableEntry);

module.exports = router;
