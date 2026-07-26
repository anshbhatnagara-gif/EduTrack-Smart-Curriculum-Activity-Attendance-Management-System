const academicService = require('../services/academic.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Academic Sessions
const createSession = asyncHandler(async (req, res) => {
  const { name, startDate, endDate, isActive } = req.body;
  const result = await academicService.createAcademicSession({ name, startDate, endDate, isActive });
  return ApiResponse.success(res, 201, result, 'Academic session created successfully.');
});

const getSessions = asyncHandler(async (req, res) => {
  const result = await academicService.getAcademicSessions();
  return ApiResponse.success(res, 200, result, 'Academic sessions retrieved successfully.');
});

const updateSession = asyncHandler(async (req, res) => {
  const { name, startDate, endDate, isActive } = req.body;
  const result = await academicService.updateAcademicSession(req.params.id, { name, startDate, endDate, isActive });
  return ApiResponse.success(res, 200, result, 'Academic session updated successfully.');
});

// Classes
const createClass = asyncHandler(async (req, res) => {
  const { name, numericLevel, academicSessionId, status } = req.body;
  const result = await academicService.createClass({ name, numericLevel, academicSessionId, status });
  return ApiResponse.success(res, 201, result, 'Class created successfully.');
});

const getClasses = asyncHandler(async (req, res) => {
  const sessionId = req.query.academicSessionId || null;
  const result = await academicService.getClasses(sessionId);
  return ApiResponse.success(res, 200, result, 'Classes retrieved successfully.');
});

const updateClass = asyncHandler(async (req, res) => {
  const { name, numericLevel, academicSessionId, status } = req.body;
  const result = await academicService.updateClass(req.params.id, { name, numericLevel, academicSessionId, status });
  return ApiResponse.success(res, 200, result, 'Class updated successfully.');
});

// Sections
const createSection = asyncHandler(async (req, res) => {
  const { classId, name, roomNumber, capacity } = req.body;
  const result = await academicService.createSection({ classId, name, roomNumber, capacity });
  return ApiResponse.success(res, 201, result, 'Section created successfully.');
});

const getSections = asyncHandler(async (req, res) => {
  const classId = req.query.classId || null;
  const result = await academicService.getSections(classId);
  return ApiResponse.success(res, 200, result, 'Sections retrieved successfully.');
});

const updateSection = asyncHandler(async (req, res) => {
  const { classId, name, roomNumber, capacity } = req.body;
  const result = await academicService.updateSection(req.params.id, { classId, name, roomNumber, capacity });
  return ApiResponse.success(res, 200, result, 'Section updated successfully.');
});

// Subjects
const createSubject = asyncHandler(async (req, res) => {
  const { subjectCode, name, description } = req.body;
  const result = await academicService.createSubject({ subjectCode, name, description });
  return ApiResponse.success(res, 201, result, 'Subject created successfully.');
});

const getSubjects = asyncHandler(async (req, res) => {
  const result = await academicService.getSubjects();
  return ApiResponse.success(res, 200, result, 'Subjects retrieved successfully.');
});

const getSubjectById = asyncHandler(async (req, res) => {
  const result = await academicService.getSubjectById(req.params.id);
  return ApiResponse.success(res, 200, result, 'Subject details retrieved successfully.');
});

const updateSubject = asyncHandler(async (req, res) => {
  const { subjectCode, name, description } = req.body;
  const result = await academicService.updateSubject(req.params.id, { subjectCode, name, description });
  return ApiResponse.success(res, 200, result, 'Subject updated successfully.');
});

// Teacher Assignments
const assignTeacher = asyncHandler(async (req, res) => {
  const { teacherId, classId, sectionId, subjectId, academicSessionId } = req.body;
  const result = await academicService.assignTeacher({ teacherId, classId, sectionId, subjectId, academicSessionId });
  return ApiResponse.success(res, 201, result, 'Teacher assigned to class/subject successfully.');
});

const getTeacherAssignments = asyncHandler(async (req, res) => {
  const teacherId = req.query.teacherId || null;
  const result = await academicService.getTeacherAssignmentsList(teacherId);
  return ApiResponse.success(res, 200, result, 'Teacher assignments retrieved successfully.');
});

const removeTeacherAssignment = asyncHandler(async (req, res) => {
  await academicService.removeTeacherAssignment(req.params.id);
  return ApiResponse.success(res, 200, {}, 'Teacher assignment removed successfully.');
});

// Student Enrollments
const enrollStudent = asyncHandler(async (req, res) => {
  const { studentId, classId, sectionId, academicSessionId, rollNumber, enrollmentStatus } = req.body;
  const result = await academicService.enrollStudent({ studentId, classId, sectionId, academicSessionId, rollNumber, enrollmentStatus });
  return ApiResponse.success(res, 201, result, 'Student enrolled successfully.');
});

const getEnrollments = asyncHandler(async (req, res) => {
  const classId = req.query.classId || null;
  const sectionId = req.query.sectionId || null;
  const result = await academicService.getStudentEnrollments(classId, sectionId);
  return ApiResponse.success(res, 200, result, 'Student enrollments retrieved successfully.');
});

const updateEnrollment = asyncHandler(async (req, res) => {
  const { enrollmentStatus } = req.body;
  await academicService.updateEnrollmentStatus(req.params.id, enrollmentStatus);
  return ApiResponse.success(res, 200, {}, `Enrollment status updated to ${enrollmentStatus} successfully.`);
});

module.exports = {
  createSession,
  getSessions,
  updateSession,
  createClass,
  getClasses,
  updateClass,
  createSection,
  getSections,
  updateSection,
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  assignTeacher,
  getTeacherAssignments,
  removeTeacherAssignment,
  enrollStudent,
  getEnrollments,
  updateEnrollment
};
