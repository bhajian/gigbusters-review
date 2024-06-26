import { DocumentClient, ScanInput } from 'aws-sdk/clients/dynamodb'
import { v4 as uuidv4 } from 'uuid'
import {
    ReviewEntity,
    ReviewKeyParams
} from "./review-types";
import {PhotoEntry} from "./reviewable-types";

interface ReviewServiceProps{
    reviewTable: string
    reviewableTable: string
    bucket?: string
}

export class ReviewService {

    private props: ReviewServiceProps
    private documentClient = new DocumentClient()

    public constructor(props: ReviewServiceProps){
        this.props = props
    }

    async list(userId: string): Promise<ReviewEntity[]> {
        const response = await this.documentClient
            .query({
                TableName: this.props.reviewTable,
                IndexName: 'userIdIndex',
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues : {':userId' : userId}
            }).promise()
        if (response.Items === undefined) {
            return [] as ReviewEntity[]
        }
        return response.Items as ReviewEntity[]
    }

    async query(params: any): Promise<ReviewEntity[]> {
        const response = await this.documentClient
            .query({
                TableName: this.props.reviewTable,
                IndexName: 'reviewableIndex',
                KeyConditionExpression: 'uri = :uri and #type = :type',
                ExpressionAttributeNames: {
                    '#type': 'type'
                },
                ExpressionAttributeValues : {
                    ':uri' : params.uri,
                    ':type' : params.type,
                },
                Limit: params.Limit,
                ExclusiveStartKey: params.lastEvaluatedKey
            }).promise()
        if (response.Items === undefined) {
            return [] as ReviewEntity[]
        }
        return response.Items as ReviewEntity[]
    }

    async get(params: ReviewKeyParams): Promise<ReviewEntity> {
        const response = await this.documentClient
            .get({
                TableName: this.props.reviewTable,
                Key: {
                    id: params.id,
                },
            }).promise()
        return response.Item as ReviewEntity
    }

    async put(params: ReviewEntity): Promise<ReviewEntity> {
        await this.documentClient
            .put({
                TableName: this.props.reviewTable,
                Item: params,
                ConditionExpression: 'userId = :userId',
                ExpressionAttributeValues : {':userId' : params.userId}
            }).promise()
        return params
    }

    async delete(params: ReviewKeyParams) {
        await this.documentClient
            .delete({
                TableName: this.props.reviewTable,
                Key: {
                    id: params.id,
                },
                ConditionExpression: 'userId = :userId',
                ExpressionAttributeValues : {':userId' : params.userId}
            }).promise()
    }

    async putComplexReview(params: ReviewEntity): Promise<ReviewEntity> {
        try{
            // FIX ME => put them all in a dynamodb transaction
            const now = new Date()

            // Insert the review complex object
            const review = {
                id: uuidv4(),
                dateTime: now.toISOString(),
                uri: params.reviewable.uri,
                type: params.reviewable.type,
                ...params,
            }

            await this.documentClient
                .put({
                    TableName: this.props.reviewTable,
                    Item: review,
                }).promise().catch(e => {throw e})

            // Find the related reviewable by querying
            let reviewableRes = await this.documentClient
                .query({
                    TableName: this.props.reviewableTable,
                    KeyConditionExpression: 'uri = :uri and #type = :type',
                    ExpressionAttributeNames: {
                        '#type': 'type'
                    },
                    ExpressionAttributeValues : {
                        ':uri' : params.reviewable.uri,
                        ':type' : params.reviewable.type,
                    }
                }).promise().catch(e => {throw e})
            let reviewable = (reviewableRes && reviewableRes.Items?
                reviewableRes.Items[0] : undefined)

            if(reviewable){
                // Update the reviewable rating and number
                await this.documentClient
                    .update({
                        TableName: this.props.reviewableTable,
                        Key: {
                            uri: reviewable.uri,
                            type: reviewable.type,
                        },
                        ConditionExpression: 'uri = :uri',
                        UpdateExpression: 'set cumulativeRating = ' +
                            'if_not_exists(cumulativeRating, :zero) + :rating, ' +
                            'oneStar = if_not_exists(oneStar, :zero) + :oneStarInc, ' +
                            'twoStar = if_not_exists(twoStar, :zero) + :twoStarInc, ' +
                            'threeStar = if_not_exists(threeStar, :zero) + :threeStarInc, ' +
                            'fourStar = if_not_exists(fourStar, :zero) + :fourStarInc, ' +
                            'fiveStar = if_not_exists(fiveStar, :zero) + :fiveStarInc, ' +
                            'numberOfReviews = if_not_exists(numberOfReviews, :zero) + :inc, ' +
                            'reviews=list_append(if_not_exists(reviews, :empty_list), :reviewIds)',
                        ExpressionAttributeValues : {
                            ':zero': 0,
                            ':empty_list': [],
                            ':uri' : reviewable.uri,
                            ':rating': params.rating,
                            ':inc': 1,
                            ':oneStarInc': (params.rating === 1 ? 1 : 0),
                            ':twoStarInc': (params.rating === 2 ? 1 : 0),
                            ':threeStarInc': (params.rating === 3 ? 1 : 0),
                            ':fourStarInc': (params.rating === 4 ? 1 : 0),
                            ':fiveStarInc': (params.rating === 5 ? 1 : 0),
                            ':reviewIds': [review.id]
                        }
                    }).promise()
            } else {
                // Create a new reviewable
                reviewable = {
                    ...params.reviewable,
                    createdByUserId: params.userId,
                    createdDateTime: now.toISOString(),
                    cumulativeRating: params.rating,
                    numberOfReviews: 1,
                    oneStar : (params.rating === 1 ? 1 : 0),
                    twoStar : (params.rating === 2 ? 1 : 0),
                    threeStar : (params.rating === 3 ? 1 : 0),
                    fourStar : (params.rating === 4 ? 1 : 0),
                    fiveStar : (params.rating === 5 ? 1 : 0),
                    reviews: [review.id],
                    reviewableStatus: 'active'
                }

                await this.documentClient
                    .put({
                        TableName: this.props.reviewableTable,
                        Item: reviewable,
                    }).promise().catch(e => {throw e})
            }

            return review
        } catch (e) {
            throw e
        }
    }

    async listPhotos(params: ReviewKeyParams): Promise<PhotoEntry[]> {
        const response = await this.documentClient
            .get({
                TableName: this.props.reviewTable,
                Key: {
                    id: params.id,
                },
            }).promise()
        if (response.Item === undefined ||
            response.Item.photos === undefined ||
            response.Item.userId != params.userId) {
            throw new Error('There is no photo or user does not have an access')
        }
        return response.Item.photos as PhotoEntry[]
    }

    async getPhoto(params: ReviewKeyParams, photoParams: PhotoEntry): Promise<PhotoEntry | {}> {
        const response = await this.documentClient
            .get({
                TableName: this.props.reviewTable,
                Key: {
                    id: params.id,
                },
            }).promise()
        if (response.Item && response.Item.photos &&
            response.Item.userId == params.userId) {
            const photo = response.Item.photos.find(
                (item: PhotoEntry) => item.photoId === photoParams.photoId)
            if (!photo)
                return {}
            return photo
        }
        return {}
    }

    async addPhoto(params: ReviewKeyParams, photoParams: PhotoEntry): Promise<PhotoEntry> {
        const photoId = uuidv4()
        const newPhoto = {
            photoId: photoId,
            bucket: this.props.bucket,
            key: `${params.id}/photos/${photoId}`,
            type: photoParams.type,
            identityId: photoParams.identityId
        }
        const response = await this.documentClient
            .update({
                TableName: this.props.reviewTable,
                Key: {
                    id: params.id,
                },
                ConditionExpression: 'userId = :userId',
                UpdateExpression: 'set photos=list_append(if_not_exists(photos, :empty_list), :newPhotos)',
                ExpressionAttributeValues : {
                    ':userId': params.userId,
                    ':empty_list': [],
                    ':newPhotos': [newPhoto]
                }
            }).promise()

        return newPhoto
    }

    async deletePhoto(params: ReviewKeyParams, photoParams: PhotoEntry) {
        const response = await this.documentClient
            .get({
                TableName: this.props.reviewTable,
                Key: {
                    id: params.id,
                },
            }).promise()
        const profile = response.Item
        if (profile && profile.photos && profile.userId === params.userId) {
            const indexToRemove = profile.photos
                .findIndex((item: PhotoEntry) => item.photoId != photoParams.photoId)

            await this.documentClient
                .update({
                    TableName: this.props.reviewTable,
                    Key: {
                        id: params.id,
                    },
                    ConditionExpression: 'userId = :userId',
                    UpdateExpression: `REMOVE photos[${indexToRemove}]`,
                    ExpressionAttributeValues : {
                        ':userId': params.userId,
                    }
                }).promise()
        }
    }

}
