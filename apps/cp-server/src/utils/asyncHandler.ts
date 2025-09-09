import { Request, Response, NextFunction, RequestHandler } from "express";

const asyncHandler = (requestHandler: RequestHandler): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requestHandler(req, res, next);
    } catch (error: any) {
      // Ensure proper status code and message
      const status = (typeof error.statusCode === "number" && error.statusCode >= 100 && error.statusCode <= 599)
        ? error.statusCode
        : 500;
      res.status(status).json({
        success: false,
        message: error.message || "Something went wrong",
      });
    }
  };
};

export { asyncHandler };
