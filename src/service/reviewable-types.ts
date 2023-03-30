export interface ReviewableKeyParams {
    id?: string
    uri: string
    type: string
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
    uri: string
    type: string
    userId: string
    createdDateTime?: string
    profileUserId?: string
    reviewableStatus: string
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
