const authService = require('../services/auth.service');
const academicService = require('../services/academic.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await authService.getUserProfile(req.user.id);
  return ApiResponse.success(res, 200, profile, 'Profile retrieved successfully.');
});

// Parent specific profile views
const getMyChildren = asyncHandler(async (req, res) => {
  if (req.user.role !== 'parent') {
    throw new ApiError(403, 'Access denied. Only parents can access linked children list.');
  }

  // Find parent_id corresponding to user
  const parent = await academicService.getParentById(req.user.id); // Wait, getParentById takes parentId or user_id?
  // Let's check getParentById in academic.service: it fetches from users JOIN parents on user_id, querying parent.id.
  // Wait, let's review getParentById in academic.service:
  // "SELECT ... FROM users u JOIN parents p ON u.id = p.user_id WHERE p.id = ?"
  // Ah! It queries p.id (parent_id) which is the PK of parents table, NOT users.id.
  // Let's make sure we find the parents PK by user_id.
  // We can write a quick query to fetch parent by user_id first:
  const { query } = require('../config/database');
  const parentRows = await query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
  if (parentRows.length === 0) {
    throw new ApiError(404, 'Parent profile record not found.');
  }
  const parentId = parentRows[0].id;

  const children = await academicService.getLinkedStudents(parentId);
  return ApiResponse.success(res, 200, children, 'Linked children retrieved successfully.');
});

const getChildDetails = asyncHandler(async (req, res) => {
  if (req.user.role !== 'parent') {
    throw new ApiError(403, 'Access denied. Only parents can access linked child details.');
  }

  const childStudentId = parseInt(req.params.childStudentId, 10);

  // Retrieve parent PK by user_id
  const { query } = require('../config/database');
  const parentRows = await query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
  if (parentRows.length === 0) {
    throw new ApiError(404, 'Parent profile record not found.');
  }
  const parentId = parentRows[0].id;

  // Verify link
  const link = await query(
    'SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?',
    [parentId, childStudentId]
  );
  if (link.length === 0) {
    throw new ApiError(403, 'Access denied. You are not linked to this student.');
  }

  const childProfile = await academicService.getStudentById(childStudentId);
  return ApiResponse.success(res, 200, childProfile, 'Child profile details retrieved successfully.');
});

module.exports = {
  getMyProfile,
  getMyChildren,
  getChildDetails
};
