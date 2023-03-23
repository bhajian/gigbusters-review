import { DocumentClient, ScanInput } from 'aws-sdk/clients/dynamodb'
import { v4 as uuidv4 } from 'uuid'
import {
    ReviewEntity,
    ReviewKeyParams
} from "./review-types";

interface ReviewServiceProps{
    reviewTable: string
    reviewableTable: string
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
                IndexName: 'reviewableIdIndex',
                KeyConditionExpression: 'reviewableId = :reviewableId',
                ExpressionAttributeValues : {':reviewableId' : params.reviewableId}
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
        const response = await this.documentClient
            .put({
                TableName: this.props.reviewTable,
                Item: params,
                ConditionExpression: 'userId = :userId',
                ExpressionAttributeValues : {':userId' : params.userId}
            }).promise()
        return params
    }

    async delete(params: ReviewKeyParams) {
        const response = await this.documentClient
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
            // FIX ME => put them all in dynamodb transaction
            const now = new Date()

            // Insert the review complex object
            const review = {
                id: uuidv4(),
                dateTime: now.toISOString(),
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
                    IndexName: 'uriIndex',
                    KeyConditionExpression: 'uri = :uri',
                    ExpressionAttributeValues : {':uri' : params.reviewable.uri}
                }).promise().catch(e => {throw e})
            let reviewable = (reviewableRes && reviewableRes.Items?
                reviewableRes.Items[0] : undefined)

            if(reviewable){
                // Update the reviewable rating and number
                await this.documentClient
                    .update({
                        TableName: this.props.reviewableTable,
                        Key: {
                            id: reviewable.id,
                        },
                        ConditionExpression: 'uri = :uri',
                        UpdateExpression: 'set cumulativeRating = cumulativeRating + :rating, ' +
                            'oneStar = oneStar + :oneStarInc, ' +
                            'twoStar = twoStar + :twoStarInc, ' +
                            'threeStar = threeStar + :threeStarInc, ' +
                            'fourStar = fourStar + :fourStarInc, ' +
                            'fiveStar = fiveStar + :fiveStarInc, ' +
                            'numberOfReviews=numberOfReviews+:inc, ' +
                            'reviews=list_append(reviews, :reviewIds)',
                        ExpressionAttributeValues : {
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
                    id: uuidv4(),
                    userId: params.userId,
                    cumulativeRating: params.rating,
                    numberOfReviews: 1,
                    reviews: [review.id],
                    reviewableStatus: 'active'
                }

                await this.documentClient
                    .put({
                        TableName: this.props.reviewableTable,
                        Item: reviewable,
                    }).promise().catch(e => {throw e})

                console.log(reviewable)
            }

            // update the review with the reviewableId inserted above
            review.reviewableId = (reviewable ? reviewable.id : undefined)

            await this.documentClient
                .put({
                    TableName: this.props.reviewTable,
                    Item: review,
                }).promise()
            return review
        } catch (e) {
            throw e
        }
    }

}
