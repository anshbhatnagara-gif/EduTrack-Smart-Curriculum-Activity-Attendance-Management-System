const assignmentService = require('../services/assignment.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, classId, sectionId, subjectId, dueDate, maximumMarks } = req.body;
  let attachmentPath = null;

  if (req.file) {
    attachmentPath = `uploads/materials/${req.file.filename}`;
  }

  const assignment = await assignmentService.createAssignment(req.user, {
    classId: parseInt(classId, 10),
    sectionId: parseInt(sectionId, 10),
    subjectId: parseInt(subjectId, 10),
    title,
    description,
    attachmentPath,
    dueDate,
    maximumMarks: parseFloat(maximumMarks)
  });

  return ApiResponse.success(res, 201, assignment, 'Assignment created successfully.');
});

const getAssignments = asyncHandler(async (req, res) => {
  const filters = {
    subjectId: req.query.subjectId ? parseInt(req.query.subjectId, 10) : null
  };

  const assignments = await assignmentService.getAssignmentsList(req.user, filters);
  return ApiResponse.success(res, 200, assignments, 'Assignments retrieved successfully.');
});

const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.getAssignmentById(parseInt(req.params.id, 10), req.user);
  return ApiResponse.success(res, 200, assignment, 'Assignment retrieved successfully.');
});

const updateAssignment = asyncHandler(async (req, res) => {
  const { title, description, dueDate, maximumMarks, status } = req.body;
  let attachmentPath = undefined;

  if (req.file) {
    attachmentPath = `uploads/materials/${req.file.filename}`;
  }

  const assignment = await assignmentService.updateAssignment(parseInt(req.params.id, 10), req.user, {
    title,
    description,
    dueDate,
    maximumMarks: maximumMarks ? parseFloat(maximumMarks) : undefined,
    attachmentPath,
    status
  });

  return ApiResponse.success(res, 200, assignment, 'Assignment updated successfully.');
});

const deleteAssignment = asyncHandler(async (req, res) => {
  await assignmentService.deleteAssignment(parseInt(req.params.id, 10), req.user);
  return ApiResponse.success(res, 200, {}, 'Assignment deleted successfully.');
});

// Student Submissions
const submitAssignment = asyncHandler(async (req, res) => {
  const { submissionText } = req.body;
  let filePath = null;

  if (req.file) {
    filePath = `uploads/submissions/${req.file.filename}`;
  }

  const result = await assignmentService.submitAssignment(parseInt(req.params.id, 10), req.user, {
    submissionText,
    filePath
  });

  const msg = result.updated ? 'Submission updated successfully.' : 'Assignment submitted successfully.';
  return ApiResponse.success(res, 200, result, msg);
});

const getSubmissions = asyncHandler(async (req, res) => {
  const submissions = await assignmentService.getSubmissionsForAssignment(parseInt(req.params.id, 10), req.user);
  return ApiResponse.success(res, 200, submissions, 'Submissions retrieved successfully.');
});

const evaluateSubmission = asyncHandler(async (req, res) => {
  const { marksObtained, teacherFeedback } = req.body;
  const result = await assignmentService.evaluateSubmission(parseInt(req.params.id, 10), req.user, {
    marksObtained: parseFloat(marksObtained),
    teacherFeedback
  });

  return ApiResponse.success(res, 200, result, 'Submission evaluated successfully.');
});

const getMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await assignmentService.getMySubmissions(req.user);
  return ApiResponse.success(res, 200, submissions, 'Your submissions retrieved successfully.');
});

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  evaluateSubmission,
  getMySubmissions
};
