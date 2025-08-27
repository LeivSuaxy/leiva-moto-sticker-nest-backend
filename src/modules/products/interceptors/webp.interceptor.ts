import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import sharp from "sharp";
import { v4 as uuidv4 } from 'uuid';
import { SupabaseService } from "src/common/supabase/supabase";

@Injectable()
export class WebpInterceptor implements NestInterceptor {
    private readonly supabase;

    constructor(private readonly supabaseService: SupabaseService) {
        this.supabase = supabaseService.getClient();
    }

    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const imageUrls: string[] = [];

        try {
            // Manejar múltiples archivos (FilesInterceptor)
            if (request.files && Array.isArray(request.files)) {
                for (const file of request.files) {
                    const url = await this.processImage(file.buffer);
                    imageUrls.push(url);
                }
            }
            // Manejar archivo único para compatibilidad
            else if (request.file) {
                const url = await this.processImage(request.file.buffer);
                imageUrls.push(url);
            }

            // Agregar las URLs al request
            request.imageUrls = imageUrls;
            request.imageUrl = imageUrls[0]; // Mantener compatibilidad

        } catch (error) {
            throw new Error(`Image processing failed: ${error.message}`);
        }

        return next.handle();
    }

    private async processImage(buffer: Buffer): Promise<string> {
        const webpBuffer = await sharp(buffer)
            .webp({ quality: 80 })
            .toBuffer();

        const fileName = `products/${uuidv4()}.webp`;

        const { data, error } = await this.supabase.storage
            .from('images')
            .upload(fileName, webpBuffer, {
                contentType: 'image/webp',
                upsert: false,
            });

        if (error) {
            throw new Error(`Failed to upload image: ${error.message}`);
        }

        const { data: pub } = this.supabase.storage
            .from('images')
            .getPublicUrl(fileName);

        return pub.publicUrl;
    }
}