class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta = undefined) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    if (meta !== undefined) {
      this.meta = meta;
    }
  }

  static success(res, statusCode = 200, data = {}, message = 'Operation completed successfully', meta = undefined) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      ...(meta !== undefined && { meta })
    });
  }
}

module.exports = ApiResponse;
