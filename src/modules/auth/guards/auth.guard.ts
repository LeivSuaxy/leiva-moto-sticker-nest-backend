import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private configService: ConfigService,
        private reflector: Reflector
    ) { }

    canActivate(context: ExecutionContext): boolean {
        // Verificar si la ruta está marcada como pública
        const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('No token provided');
        }

        const token = authHeader.substring(7);
        const secret = this.configService.get<string>('SUPERUSER_SECRET');

        if (!secret) {
            throw new UnauthorizedException('Server configuration error');
        }

        try {
            const decoded = jwt.verify(token, secret) as any;
            request.user = decoded;
            return true;
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
