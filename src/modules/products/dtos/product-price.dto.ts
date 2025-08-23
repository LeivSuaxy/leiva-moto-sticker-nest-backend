
import { IsNumber, IsPositive, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ProductPricesDto {
    @IsOptional()
    @Transform(({ value }) => {
        if (value === null || value === undefined || value === '') return undefined;
        const num = Number(value);
        return isNaN(num) ? undefined : num;
    })
    @IsNumber()
    @IsPositive()
    small?: number;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === null || value === undefined || value === '') return undefined;
        const num = Number(value);
        return isNaN(num) ? undefined : num;
    })
    @IsNumber()
    @IsPositive()
    mid?: number;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === null || value === undefined || value === '') return undefined;
        const num = Number(value);
        return isNaN(num) ? undefined : num;
    })
    @IsNumber()
    @IsPositive()
    big?: number;
}