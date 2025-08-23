import { CacheTTL } from "@nestjs/cache-manager";
import { Controller, Get } from "@nestjs/common";
import { CacheTime } from "src/common/enums/cacheTimes.enum";
import { SupabaseService } from "src/common/supabase/supabase";
import { Public } from "src/modules/auth/decorators/public.decorator";

@Controller('public')
@Public() // Todo el controlador público es accesible sin autenticación
export class PublicController {
    private readonly supabase;

    constructor(private readonly supabaseService: SupabaseService) {
        this.supabase = supabaseService.getClient();
    }

    // TODO Missing pagination, frontend specific pages.
    @Get('stickers')
    @CacheTTL(CacheTime.SIX_HOUR)
    async getStickers() {
        const { data, error } = await this.supabase
            .from('stickers')
            .select('*');

        if (error) {
            throw new Error(`Failed to fetch stickers: ${error.message}`);
        }

        return data;
    }

    @Get('tags')
    @CacheTTL(CacheTime.SIX_HOUR)
    async getTags() {
        const { data, error } = await this.supabase
            .from('tags')
            .select('*');

        if (error) {
            throw new Error(`Failed to fetch tags: ${error.message}`);
        }

        return data;
    }
}