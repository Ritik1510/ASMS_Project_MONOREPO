class ApiError extends Error {
  statusCode: number;
  data: any | null;
  success: boolean;
  errors: unknown[];

  constructor(
    statusCode: number,
    message: string = "_something went wrong_",
    errors: unknown[] = [],
    stack?: string
  ) {
    super(message);

    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
