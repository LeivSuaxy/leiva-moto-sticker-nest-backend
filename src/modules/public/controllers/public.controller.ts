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
            .from("product_view")
            .select("*")
            .eq("type", "sticker");

        if (error) console.error(error);

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

    // Stickers view
    @Get('view/stickers')
    async getStickersView() {
        const stickerPromise = this.supabase
            .from('products')
            .select('*')
            .eq('type', 'sticker')
            .range(0, 16);

        const tagPromise = this.supabase
            .from('tags')
            .select('*')
            .range(0, 5);

        const [stickerResult, tagResult] = await Promise.all([stickerPromise, tagPromise]);

        const { data: stickerData, error: stickerError } = stickerResult;

        if (stickerError) {
            throw new Error(`Failed to fetch stickers view: ${stickerError.message}`);
        }

        const { data: tagData, error: tagError } = tagResult;

        if (tagError) {
            throw new Error(`Failed to fetch tags view: ${tagError.message}`);
        }

        return {
            stickers: stickerData,
            tags: tagData
        };
    }
}