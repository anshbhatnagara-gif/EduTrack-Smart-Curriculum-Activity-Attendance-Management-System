const assignmentService = require('../services/assignment.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const createMaterial = asyncHandler(async (req, res) => {
  const { title, description, classId, sectionId, subjectId, externalUrl, unitName, topicName } = req.body;
  
  if (!title || !classId || !subjectId || !unitName || !topicName) {
    throw new ApiError(400, 'title, classId, subjectId, unitName, and topicName are required fields.');
  }

  let filePath = null;
  let materialType = 'other';

  if (req.file) {
    // Relative path to store in MySQL
    filePath = `uploads/materials/${req.file.filename}`;
    
    // Deduce material type based on extension
    const mime = req.file.mimetype;
    if (mime.includes('pdf')) materialType = 'pdf';
    else if (mime.includes('word') || mime.includes('document')) materialType = 'docx';
    else if (mime.includes('presentation') || mime.includes('powerpoint')) materialType = 'pptx';
    else if (mime.includes('image')) materialType = 'image';
  } else if (externalUrl) {
    materialType = 'video_link'; // or other general link
  } else {
    throw new ApiError(400, 'Either a file upload or an external URL is required.');
  }

  const material = await assignmentService.addStudyMaterial(req.user, {
    classId: parseInt(classId, 10),
    sectionId: sectionId ? parseInt(sectionId, 10) : null,
    subjectId: parseInt(subjectId, 10),
    title,
    description,
    materialType,
    filePath,
    externalUrl,
    unitName,
    topicName
  });

  return ApiResponse.success(res, 201, material, 'Study material uploaded successfully.');
});

const getMaterials = asyncHandler(async (req, res) => {
  const filters = {
    classId: req.query.classId ? parseInt(req.query.classId, 10) : null,
    subjectId: req.query.subjectId ? parseInt(req.query.subjectId, 10) : null
  };

  const materials = await assignmentService.getStudyMaterials(req.user, filters);
  return ApiResponse.success(res, 200, materials, 'Study materials retrieved successfully.');
});

const getMaterialById = asyncHandler(async (req, res) => {
  const material = await assignmentService.getStudyMaterialById(parseInt(req.params.id, 10), req.user);
  return ApiResponse.success(res, 200, material, 'Study material retrieved successfully.');
});

const updateMaterial = asyncHandler(async (req, res) => {
  const { title, description, externalUrl, unitName, topicName } = req.body;
  let filePath = undefined;

  if (req.file) {
    filePath = `uploads/materials/${req.file.filename}`;
  }

  const material = await assignmentService.updateStudyMaterial(parseInt(req.params.id, 10), req.user, {
    title,
    description,
    externalUrl,
    filePath,
    unitName,
    topicName
  });

  return ApiResponse.success(res, 200, material, 'Study material updated successfully.');
});

const deleteMaterial = asyncHandler(async (req, res) => {
  await assignmentService.deleteStudyMaterial(parseInt(req.params.id, 10), req.user);
  return ApiResponse.success(res, 200, {}, 'Study material deleted successfully.');
});

module.exports = {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial
};
