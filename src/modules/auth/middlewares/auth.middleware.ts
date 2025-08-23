import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

// Extender la interfaz Request para incluir user
declare global {
    namespace Express {
        interface Request {
            user?: {
                sub: string;
                role: string;
                iat: number;
                exp: number;
            };
        }
    }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private configService: ConfigService) { }

    use(req: Request, res: Response, next: NextFunction) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('No token provided');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const secret = this.configService.get<string>('SUPERUSER_SECRET');

        if (!secret) {
            throw new UnauthorizedException('Server configuration error');
        }

        try {
            const decoded = jwt.verify(token, secret) as any;
            req.user = decoded;
            next();
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw new UnauthorizedException('Invalid token');
            } else if (error instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedException('Token expired');
            } else {
                throw new UnauthorizedException('Token verification failed');
            }
        }
    }
}
