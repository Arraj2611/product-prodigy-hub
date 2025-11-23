import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { asyncHandler } from './asyncHandler.js';

export const validate = (schema: ZodSchema) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
      return;
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
      return;
    }
  });
};

