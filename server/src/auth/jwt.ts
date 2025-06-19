import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, authConfig.jwt.secret, {
    expiresIn: authConfig.jwt.expiresIn
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, authConfig.jwt.secret, {
    expiresIn: authConfig.jwt.refreshExpiresIn
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, authConfig.jwt.secret) as JWTPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, authConfig.jwt.secret) as RefreshTokenPayload;
};