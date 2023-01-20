export interface CategoryGetParams {
    name: string
}
export interface CategoryEntity {
    userId: string
    name: string
    ranking: number
}
export interface CategoryCreateParams {
    userId: string
    name: string
    ranking: number
}

export type CategoryPutParams = CategoryEntity
export type CategoryDeleteParams = CategoryGetParams
