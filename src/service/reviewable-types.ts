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
    userId: string
    type: string
    cumulativeRating: number
    numberOfReviews: number
    claimedBy?: string
    photos: [PhotoEntry]
    location: LocationEntry
    categories: string[]
}
