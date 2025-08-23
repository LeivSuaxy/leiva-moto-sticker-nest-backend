import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsArray,
    IsOptional,
    ValidateNested,
    ArrayMinSize,
    ArrayMaxSize,
    MinLength,
    MaxLength
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ProductType } from '../types/productType';
import { ProductPricesDto } from './product-price.dto';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(100)
    title: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(1000)
    description: string;

    @IsEnum(ProductType)
    type: ProductType;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ArrayMaxSize(20)
    @Transform(({ value }) => {
        // Si viene como string (formato: "tag1,tag2,tag3")
        if (typeof value === 'string') {
            try {
                // Intentar parsear como JSON primero
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed.map(tag => tag.trim()).filter(tag => tag.length > 0);
                }
            } catch {
                // Si no es JSON válido, tratar como string separado por comas
                return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            }
        }
        // Si ya es array, solo limpiar
        if (Array.isArray(value)) {
            return value.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
        }
        return [];
    })
    tags?: string[];

    @ValidateNested()
    @Type(() => ProductPricesDto)
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return {};
            }
        }
        return value || {};
    })
    prices: ProductPricesDto;

    // Este campo será manejado por multer, no necesita validación aquí
    // Las imágenes se validarán en el interceptor/pipe de multer
    images?: Express.Multer.File[];
}

// dto/create-sticker.dto.ts (mantener compatibilidad)
export class CreateStickerDto extends CreateProductDto {
    type: ProductType.STICKER = ProductType.STICKER;
}