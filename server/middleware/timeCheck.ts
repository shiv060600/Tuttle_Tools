import { Request, Response, NextFunction } from 'express';


//Middleware to block changes between 6-8 AM during business processing
 
const blockDuringBusinessHours = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  const now = new Date();
  const hours = now.getHours();

  if (hours >= 6 && hours <= 8) {
    return res.status(403).json({
      error: 'Changes not allowed between 6-8 AM during business processing'
    });
  }

  next();
};

export { blockDuringBusinessHours };

