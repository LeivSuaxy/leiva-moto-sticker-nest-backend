import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthGuard } from './guards/auth.guard';

@Module({
    controllers: [AuthController],
    providers: [AuthGuard],
    exports: [AuthGuard],
})
export class AuthModule { }