import { Module } from "@nestjs/common";
import { PublicController } from "./controllers/public.controller";
import { SupabaseService } from "src/common/supabase/supabase";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { CacheInterceptorMod } from "./interceptors/cache.interceptor";
import { PublicService } from "./services/public.service";

@Module({
    controllers: [PublicController],
    providers: [
        SupabaseService,
        PublicService,
        {
            provide: APP_INTERCEPTOR,
            useClass: CacheInterceptorMod
        }
    ]
})
export class PublicModule { }