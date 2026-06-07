/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response } from 'express';
import { jwtHelpers } from './jwtHelpers';
import AppError from './AppError';
import { env } from '../../config/env';

const UNAUTHORIZED = 401;

export type TJwtPayload = {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
};

export const tokenDecoder = (req: Request) => {
  const token = req.headers.authorization;
  if (!token) {
        console.log(token)
    throw new AppError(UNAUTHORIZED, 'You Are Not Authorized')
  }
  const decoded = jwtHelpers.verifyToken(
    token as string,
    env.JWT_ACCESS_SECRET,
  );
  return decoded;
};
