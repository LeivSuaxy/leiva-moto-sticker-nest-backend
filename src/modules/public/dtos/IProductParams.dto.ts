export interface IProductParams {
    page: number,
    limit: number,
    tags: string[],
    prices: number[],
}

export interface IFilterProducts {
    tags: string[],
    prices: number[],
}