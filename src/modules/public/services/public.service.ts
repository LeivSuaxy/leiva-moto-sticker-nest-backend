import { Injectable } from "@nestjs/common";
import { IPagination } from "src/common/interfaces/IPagination.interface";
import { SupabaseService } from "src/common/supabase/supabase";
import { IFilterProducts } from "../dtos/IProductParams.dto";

@Injectable()
export class PublicService {
    private readonly supabase;

    constructor(private readonly supabaseService: SupabaseService) {
        this.supabase = supabaseService.getClient();
    }

    async getProductsFiltered(pagination: IPagination, filters: IFilterProducts) {
        let query = this.supabase
            .from('product_view')
            .select('*', { count: 'exact' });

        // Aplicar filtros de tags si existen
        if (filters.tags && filters.tags.length > 0) {
            // Supabase utiliza la función overlap para verificar si arrays se superponen
            query = query.contains('tags', filters.tags);
        }

        // Aplicar filtros de precio si existe un rango
        if (filters.prices && filters.prices.length === 2) {
            const [minPrice, maxPrice] = filters.prices;

            if (minPrice > 0) {
                query = query.gte('min_price', minPrice);
            }

            if (maxPrice > 0) {
                query = query.lte('min_price', maxPrice);
            }
        }

        // Aplicar paginación
        const from = (pagination.page - 1) * pagination.limit;
        const to = from + pagination.limit - 1;

        query = query.range(from, to);

        // Ordenar por fecha de creación (más recientes primero)
        query = query.order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
            throw new Error(`Failed to fetch filtered products: ${error.message}`);
        }

        // Calcular metadatos de paginación
        const totalPages = Math.ceil((count || 0) / pagination.limit);
        const hasNextPage = pagination.page < totalPages;
        const hasPrevPage = pagination.page > 1;

        return {
            data: data || [],
            pagination: {
                currentPage: pagination.page,
                limit: pagination.limit,
                totalItems: count || 0,
                totalPages,
                hasNextPage,
                hasPrevPage
            },
            filters: {
                appliedTags: filters.tags || [],
                appliedPriceRange: filters.prices || []
            }
        };
    }
}