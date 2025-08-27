import { CacheTTL } from "@nestjs/cache-manager";
import { Controller, Get, Inject, Param } from "@nestjs/common";
import { CacheTime } from "src/common/enums/cacheTimes.enum";
import { SupabaseService } from "src/common/supabase/supabase";
import { Public } from "src/modules/auth/decorators/public.decorator";
import { ParamFiltersCatalogo } from "../decorators/public.decorator";
import type { IFilterProducts, IProductParams } from "../dtos/IProductParams.dto";
import { IPagination } from "src/common/interfaces/IPagination.interface";
import { PublicService } from "../services/public.service";

// Interfaces para tipado
interface Product {
    id: string; // Mantener como string UUID
    title: string;
    description: string;
    image_url: string[];
    size: { [key: string]: number };
    price: number;
    tags: string[];
}

interface SupabaseProductResponse {
    id: string;
    title: string;
    description: string;
    images: Array<{ id: string; image_url: string }>;
    sizes: Array<{ id: string; size: string; price: number }>;
    products_tags: Array<{
        id: string;
        tags: { id: string; name: string };
    }>;
}

@Controller('public')
@Public() // Todo el controlador público es accesible sin autenticación
export class PublicController {
    private readonly supabase;

    constructor(
        @Inject(PublicService)
        private readonly service: PublicService,
        private readonly supabaseService: SupabaseService
    ) {
        this.supabase = supabaseService.getClient();
    }

    // TODO Missing pagination, frontend specific pages.
    @Get('stickers')
    async getStickers() {
        const { data, error } = await this.supabase
            .from("product_view")
            .select("*")
            .eq("type", "sticker");

        if (error) console.error(error);

        return data;
    }

    @Get('tags')
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

    @Get('view/main')
    async getMainView() {
        const stickerPromise = this.supabase
            .from('product_view')
            .select('*')
            .eq('type', 'sticker')
            .range(0, 7);

        const productPromise = this.supabase
            .from('product_view')
            .select('*')
            .eq('type', 'product')
            .range(0, 7);

        const tagPromise = this.supabase
            .from('tags')
            .select('*')
            .range(0, 5);

        const [stickerResult, productResult, tagResult] = await Promise.all([stickerPromise, productPromise, tagPromise]);

        const { data: stickerData, error: stickerError } = stickerResult;

        if (stickerError) {
            throw new Error(`Failed to fetch stickers view: ${stickerError.message}`);
        }

        const { data: tagData, error: tagError } = tagResult;

        if (tagError) {
            throw new Error(`Failed to fetch tags view: ${tagError.message}`);
        }

        const { data: productData, error: productError } = productResult;

        if (productError) {
            throw new Error(`Failed to fetch products view: ${productError}`);
        }

        return {
            stickers: stickerData,
            products: productData,
            tags: tagData
        }

    }

    @Get('view/catalogo')
    async getCatalogoView(@ParamFiltersCatalogo() query: IProductParams) {
        const pagination: IPagination = {
            page: query.page,
            limit: query.limit,
        }

        const filters: IFilterProducts = {
            tags: query.tags,
            prices: query.prices,
        }

        return await this.service.getProductsFiltered(pagination, filters);
    }

    @Get('product/:id')
    async getProduct(@Param('id') id: string): Promise<Product> {
        const { data, error } = await this.supabase
            .from('products')
            .select(`
                *,
                images (
                    id,
                    image_url
                ),
                sizes (
                    id,
                    size,
                    price
                ),
                products_tags (
                    id,
                    tags (
                        id,
                        name
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            throw new Error(`Failed to fetch product: ${error.message}`);
        }

        if (!data) {
            throw new Error('Product not found');
        }

        // Transformar la respuesta al formato esperado
        return this.transformProductResponse(data);
    }

    private transformProductResponse(data: SupabaseProductResponse): Product {
        // Extraer URLs de imágenes
        const imageUrls = data.images?.map(img => img.image_url) || [];

        // Crear objeto de sizes { "size_name": price }
        const sizes: { [key: string]: number } = {};
        data.sizes?.forEach(size => {
            sizes[size.size] = size.price;
        });

        // Extraer nombres de tags
        const tags = data.products_tags?.map(pt => pt.tags.name) || [];

        // Calcular precio base (el menor precio disponible)
        const prices = data.sizes?.map(size => size.price) || [];
        const basePrice = prices.length > 0 ? Math.min(...prices) : 0;

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            image_url: imageUrls,
            size: sizes,
            price: basePrice,
            tags: tags
        };
    }
}