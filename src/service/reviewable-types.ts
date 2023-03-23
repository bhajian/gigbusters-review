export interface ReviewableKeyParams {
    id: string
    uri?: string
    userId: string
}
export interface PhotoEntry {
    photoId: string
    bucket?: string
    key?: string
    type?: string
}
export interface LocationEntry {
    locationName: string
    latitude: number
    longitude: number
}
export interface ReviewableEntity {
    id: string
    uri: string
    createdbyUserId: string
    profileUserId?: string
    reviewableStatus: string
    type: string
    cumulativeRating: number
    numberOfReviews: number
    oneStarCount?: number
    twoStarCount?: number
    threeStarCount?: number
    fourStarCount?: number
    fiveStarCount?: number
    photos: [PhotoEntry]
    location: LocationEntry
    categories: string[]
    reviews?: string[]
}
