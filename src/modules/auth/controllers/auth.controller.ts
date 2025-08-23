import { Controller, Post, Body } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { LoginRequest } from "../interfaces/auth.interface";
import * as jwt from 'jsonwebtoken';
import { Public } from "../decorators/public.decorator";

@Controller('auth')
export class AuthController {
    constructor(private configService: ConfigService) { }

    @Post('login')
    @Public() // Ruta pública para login
    async login(@Body() body: LoginRequest) {
        const expectedUser = this.configService.get<string>('SUPERUSER_USER');
        const expectedPass = this.configService.get<string>('SUPERUSER_PASS');
        const secret = this.configService.get<string>('SUPERUSER_SECRET');

        if (!expectedUser || !expectedPass || !secret) {
            console.error('SUPERUSER_* env vars missing');
            return { status: 500, body: { error: 'Server configuration error' } };
        }

        if (body.user !== expectedUser || body.password !== expectedPass) {
            return { status: 401, body: { error: 'Invalid credentials' } };
        }

        const token = jwt.sign({ sub: body.user, role: 'superuser' }, secret, { expiresIn: '12h' });
        return { status: 200, body: { token: token } };
    }
}