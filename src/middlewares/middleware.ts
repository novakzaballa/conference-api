import { Request, Response, NextFunction } from 'express';

export const AuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // TODO: implement authentication logic (out of this scope)
    next();
};
