import { Controller, Get, Post, Put, Delete, UploadedFiles, Body, UseInterceptors, Req, UsePipes, ValidationPipe } from "@nestjs/common";
import { CreateProductDto, type CreateStickerDto } from "../dtos/products.dto";
import { FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { WebpInterceptor } from "../interceptors/webp.interceptor";
import { TransformJsonInterceptor } from "../interceptors/transform-json.interceptor";
import { SupabaseService } from "src/common/supabase/supabase";
import { ImageValidationPipe } from "../pipes/validationImages.pipe";
import { Public } from "src/modules/auth/decorators/public.decorator";

@Controller('products')
@Public()
export class ProductsController {
    private readonly supabase;

    constructor(private readonly supabaseService: SupabaseService) {
        this.supabase = supabaseService.getClient();
    }

    @Get()
    async getAll() {

    }

    @Post()
    @UseInterceptors(
        FilesInterceptor('images', 10, { storage: memoryStorage() }),
        TransformJsonInterceptor, // Ejecutar primero para transformar JSON strings
        WebpInterceptor
    )
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    async create(@Body() createProductDto: CreateProductDto, @UploadedFiles(ImageValidationPipe) images: Express.Multer.File[], @Req() request: any) {
        // Debug: ver qué datos están llegando
        console.log('Received createProductDto:', JSON.stringify(createProductDto, null, 2));
        console.log('Received images count:', images?.length);

        if (!images || images.length === 0) {
            throw new Error('At least one image is required');
        }

        // Verificar que prices existe y tiene la estructura correcta
        if (!createProductDto.prices) {
            console.error('Prices is undefined or null:', createProductDto.prices);
            throw new Error('Prices are required');
        }

        const { prices } = createProductDto;

        const hasValidPrices = (prices.small ?? 0) > 0 || (prices.mid ?? 0) > 0 || (prices.big ?? 0) > 0;

        if (!hasValidPrices) {
            throw new Error('At least one valid price must be provided.');
        }

        // Obtener las URLs de las imágenes procesadas del interceptor
        const imageUrls = request.imageUrls || [];

        if (!imageUrls || imageUrls.length === 0) {
            throw new Error('Failed to process images');
        }

        // Continuar con la creación del producto
        const { data, error } = await this.supabase
            .rpc('create_product', {
                p_title: createProductDto.title,
                p_description: createProductDto.description,
                p_type: createProductDto.type,
                p_tags: createProductDto.tags,
                p_image_url: imageUrls, // Usar las URLs procesadas
                p_small: prices.small ?? null,
                p_mid: prices.mid ?? null,
                p_big: prices.big ?? null
            });
        if (error) {
            throw new Error(`Failed to create product: ${error.message}`);
        }
        return data;
    }

}