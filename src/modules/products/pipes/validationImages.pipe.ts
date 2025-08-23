import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
    private readonly maxSize = 10 * 1024 * 1024; // 10MB
    private readonly allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ];

    transform(files: Express.Multer.File[]): Express.Multer.File[] {
        if (!files || files.length === 0) {
            throw new BadRequestException('Se requiere al menos una imagen');
        }

        if (files.length > 10) {
            throw new BadRequestException('Máximo 10 imágenes permitidas');
        }

        files.forEach((file, index) => {
            // Validar tipo de archivo
            if (!this.allowedMimeTypes.includes(file.mimetype)) {
                throw new BadRequestException(
                    `Imagen ${index + 1}: Tipo de archivo no permitido. Solo se permiten: ${this.allowedMimeTypes.join(', ')}`
                );
            }

            // Validar tamaño
            if (file.size > this.maxSize) {
                throw new BadRequestException(
                    `Imagen ${index + 1}: Tamaño máximo permitido es 10MB`
                );
            }
        });

        return files;
    }
}