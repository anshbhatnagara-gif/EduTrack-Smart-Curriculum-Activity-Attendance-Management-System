const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

router.use(authenticate);
router.use(authorizeRoles('admin', 'teacher'));

router.get('/', auditController.getAuditLogs);
router.get('/:id', auditController.getAuditLogById);

module.exports = router;
