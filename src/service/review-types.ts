import {LocationEntry, PhotoEntry, ReviewableEntity} from "./reviewable-types";

export interface ReviewKeyParams {
    reviewableId?: string
    userId?: string
    id?: string
}
export interface ReviewEntity {
    id?: string
    reviewableId?: string
    reviewable: ReviewableEntity
    userId: string
    createdByUserId: string
    review: string
    rating: number
    photos: [PhotoEntry]
    location: LocationEntry
    category: string
    dateTime?: string
}
