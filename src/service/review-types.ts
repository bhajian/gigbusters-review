export interface ReviewKeyParams {
    reviewableId?: string
    userId?: string
    id?: string
}
export interface ReviewEntity {
    id: string
    reviewableId?: string
    userId: string
    review: string
    rating: number
    photos: [PhotoEntry]
    location: LocationEntry
    category: string
}

export interface ComplexReviewEntity {
    // id: string
    reviewable: ReviewableEntity
    userId: string
    review: string
    rating: number
    photos: [PhotoEntry]
    location: LocationEntry
    category: string
}

export interface PhotoEntry {
    photoId: string
    bucket?: string
    key?: string
    type: string
}
export interface LocationEntry {
    locationName: string
    latitude: number
    longitude: number
}
export interface ReviewableEntity {
    id: string
    uri: string
    userId: string
    type: string
    cumulativeRate: number
    numberOfReviews: number
    claimedBy?: string
    photos: [PhotoEntry]
    location: LocationEntry
    categories: string[]
}
