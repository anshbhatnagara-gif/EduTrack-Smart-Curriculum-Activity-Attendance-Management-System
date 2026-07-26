const express = require('express');
const router = express.Router();
const materialController = require('../controllers/material.controller');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', materialController.getMaterials);
router.get('/:id', materialController.getMaterialById);

// Staff and Admin routes
router.post('/', authorizeRoles('teacher', 'admin'), upload.single('file'), materialController.createMaterial);
router.put('/:id', authorizeRoles('teacher', 'admin'), upload.single('file'), materialController.updateMaterial);
router.delete('/:id', authorizeRoles('teacher', 'admin'), materialController.deleteMaterial);

module.exports = router;
