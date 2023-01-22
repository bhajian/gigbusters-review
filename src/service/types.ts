export interface ReviewGetParams {
    name: string
}
export interface ReviewEntity {
    userId: string
    name: string
    ranking: number
}
export interface ReviewCreateParams {
    userId: string
    name: string
    ranking: number
}

export type ReviewPutParams = ReviewEntity
export type ReviewDeleteParams = ReviewGetParams
