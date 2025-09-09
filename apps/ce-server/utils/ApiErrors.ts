class ApiErrors extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public errors: unknown[] = [],
        public success = false,
        public data: unknown = null,
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