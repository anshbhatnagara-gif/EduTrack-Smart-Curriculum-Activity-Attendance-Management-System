const academicService = require('../services/academic.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPaginationParams } = require('../utils/pagination');

// ----------------------------------------------------
// TEACHERS CRUD
// ----------------------------------------------------

const createTeacher = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, employeeCode, qualification, joiningDate, profileImage } = req.body;
  const result = await academicService.createTeacher(
    { fullName, email, phone, password, profileImage },
    { employeeCode, qualification, joiningDate }
  );
  return ApiResponse.success(res, 201, result, 'Teacher created successfully.');
});

const getTeachers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const search = req.query.search || '';
  const status = req.query.status || '';

  const results = await academicService.getTeachers({ page, limit, offset, search, status });
  return ApiResponse.success(res, 200, results.results, 'Teachers retrieved successfully.', results.pagination);
});

const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await academicService.getTeacherById(req.params.id);
  return ApiResponse.success(res, 200, teacher, 'Teacher details retrieved successfully.');
});

const updateTeacher = asyncHandler(async (req, res) => {
  const { fullName, email, phone, qualification, joiningDate, profileImage } = req.body;
  const teacher = await academicService.updateTeacher(
    req.params.id,
    { fullName, email, phone, profileImage },
    { qualification, joiningDate }
  );
  return ApiResponse.success(res, 200, teacher, 'Teacher details updated successfully.');
});

const updateTeacherStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const teacher = await academicService.getTeacherById(req.params.id);
  await academicService.changeUserStatus(teacher.user_id, status);
  return ApiResponse.success(res, 200, {}, `Teacher status updated to ${status} successfully.`);
});

// ----------------------------------------------------
// STUDENTS CRUD
// ----------------------------------------------------

const createStudent = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, admissionNumber, rollNumber, dateOfBirth, gender, admissionDate, profileImage } = req.body;
  const result = await academicService.createStudent(
    { fullName, email, phone, password, profileImage },
    { admissionNumber, rollNumber, dateOfBirth, gender, admissionDate }
  );
  return ApiResponse.success(res, 201, result, 'Student created successfully.');
});

const getStudents = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const search = req.query.search || '';
  const status = req.query.status || '';
  const classId = req.query.classId || '';
  const sectionId = req.query.sectionId || '';

  const results = await academicService.getStudents({ page, limit, offset, search, status, classId, sectionId });
  return ApiResponse.success(res, 200, results.results, 'Students retrieved successfully.', results.pagination);
});

const getStudentById = asyncHandler(async (req, res) => {
  const student = await academicService.getStudentById(req.params.id);
  return ApiResponse.success(res, 200, student, 'Student details retrieved successfully.');
});

const updateStudent = asyncHandler(async (req, res) => {
  const { fullName, email, phone, rollNumber, dateOfBirth, gender, admissionDate, profileImage } = req.body;
  const student = await academicService.updateStudent(
    req.params.id,
    { fullName, email, phone, profileImage },
    { rollNumber, dateOfBirth, gender, admissionDate }
  );
  return ApiResponse.success(res, 200, student, 'Student details updated successfully.');
});

const updateStudentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const student = await academicService.getStudentById(req.params.id);
  await academicService.changeUserStatus(student.user_id, status);
  return ApiResponse.success(res, 200, {}, `Student status updated to ${status} successfully.`);
});

// ----------------------------------------------------
// PARENTS CRUD
// ----------------------------------------------------

const createParent = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, occupation, relationshipType, profileImage } = req.body;
  const result = await academicService.createParent(
    { fullName, email, phone, password, profileImage },
    { occupation, relationshipType }
  );
  return ApiResponse.success(res, 201, result, 'Parent created successfully.');
});

const getParents = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const search = req.query.search || '';
  const status = req.query.status || '';

  const results = await academicService.getParents({ page, limit, offset, search, status });
  return ApiResponse.success(res, 200, results.results, 'Parents retrieved successfully.', results.pagination);
});

const getParentById = asyncHandler(async (req, res) => {
  const parent = await academicService.getParentById(req.params.id);
  return ApiResponse.success(res, 200, parent, 'Parent details retrieved successfully.');
});

const updateParent = asyncHandler(async (req, res) => {
  const { fullName, email, phone, occupation, relationshipType, profileImage } = req.body;
  const parent = await academicService.updateParent(
    req.params.id,
    { fullName, email, phone, profileImage },
    { occupation, relationshipType }
  );
  return ApiResponse.success(res, 200, parent, 'Parent details updated successfully.');
});

const updateParentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const parent = await academicService.getParentById(req.params.id);
  await academicService.changeUserStatus(parent.user_id, status);
  return ApiResponse.success(res, 200, {}, `Parent status updated to ${status} successfully.`);
});

// Parent-Student Links
const linkParentStudent = asyncHandler(async (req, res) => {
  const { parentId, studentId, relationship, isPrimary } = req.body;
  await academicService.linkParentStudent(parentId, studentId, relationship, isPrimary);
  return ApiResponse.success(res, 200, {}, 'Parent and student linked successfully.');
});

const getLinkedStudents = asyncHandler(async (req, res) => {
  const students = await academicService.getLinkedStudents(req.params.parentId);
  return ApiResponse.success(res, 200, students, 'Linked children retrieved successfully.');
});

module.exports = {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  updateTeacherStatus,
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  updateStudentStatus,
  createParent,
  getParents,
  getParentById,
  updateParent,
  updateParentStatus,
  linkParentStudent,
  getLinkedStudents
};
