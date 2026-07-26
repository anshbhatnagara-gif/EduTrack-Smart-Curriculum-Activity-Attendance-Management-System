const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', notificationController.getMyNotifications);
router.patch('/read-all', notificationController.markAllNotificationsRead);
router.patch('/:id/read', notificationController.markNotificationRead);

module.exports = router;
