import { Module } from '@nestjs/common';
import { ProductsController } from './controllers/products.controller';
import { SupabaseService } from 'src/common/supabase/supabase';
import { WebpInterceptor } from './interceptors/webp.interceptor';

@Module({
    controllers: [ProductsController],
    providers: [SupabaseService, WebpInterceptor],
})
export class ProductsModule { }