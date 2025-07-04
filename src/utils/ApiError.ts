class ApiError extends Error {
    statusCode: number;
    data: any | null;
    override message: string;
    success: boolean;
    errors: any[];

    constructor(
        statusCode: number,
        message = "Something went wrong",
        data: any | null = null,
        errors: any[] = [],
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
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

export { ApiError };
