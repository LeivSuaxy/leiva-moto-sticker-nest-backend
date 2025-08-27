import { createParamDecorator, ExecutionContext, applyDecorators } from "@nestjs/common";

export const ParamFiltersCatalogo = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const query = request.query;

        return {
            page: query.page ? Number(query.page) : 1,
            limit: query.limit ? Number(query.limit) : 30,
            tags: query.tags
                ? query.tags.split(',').map(String)
                : undefined,
            prices: query.prices
                ? query.prices.split('-').map(Number)
                : undefined,
        };
    },
);