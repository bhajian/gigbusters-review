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
                ExpressionAttributeValues : {
                    ':reviewableId' : params.reviewableId
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
                            'reviews=list_append(reviews, :reviewIds)',
                        ExpressionAttributeValues : {
                            ':zero': 0,
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
                    userId: params.userId,
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
