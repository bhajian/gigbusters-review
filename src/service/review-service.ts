import { DocumentClient, ScanInput } from 'aws-sdk/clients/dynamodb'
import { v4 as uuidv4 } from 'uuid'
import {
    ComplexReviewEntity,
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
            .scan({
                TableName: this.props.reviewTable,
                FilterExpression: 'ranking >= :ranking',
                ExpressionAttributeValues: {
                    ':ranking': 0
                },
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
            }).promise()
    }

    async putComplexReview(params: ComplexReviewEntity): Promise<any> {
        const reviewableParam = params.reviewable
        reviewableParam.userId = params.userId
        delete params.reviewable
        console.log(reviewableParam)
        console.log(params)

        let reviewableRes = await this.documentClient
            .query({
                TableName: this.props.reviewableTable,
                IndexName: 'uriIndex',
                KeyConditionExpression: 'uri = :uri',
                ExpressionAttributeValues : {':uri' : reviewableParam.uri}
            }).promise()
        let reviewable = ((reviewableRes && reviewableRes.Items?
            reviewableRes.Items[0] : undefined))
        console.log(reviewable)
        if(reviewable){
            console.log('reviewable')
            console.log(reviewable)
            const response = await this.documentClient
                .update({
                    TableName: this.props.reviewableTable,
                    Key: {
                        id: reviewable.id,
                    },
                    ConditionExpression: 'uri = :uri',
                    UpdateExpression: 'set cumulativeRate = (cumulativeRate*numberOfReviews + :rating)/ (numberOfReviews + 1), ' +
                        ' numberOfReviews=numberOfReviews + 1',
                    ExpressionAttributeValues : {
                        ':uri' : reviewable.uri,
                        ':rating': params.rating
                    }
                }).promise()
        } else {
            console.log('new')
            reviewableParam.id = uuidv4()
            reviewableParam.numberOfReviews = 1
            reviewableParam.cumulativeRate = params.rating
            reviewableRes = await this.documentClient
                .put({
                    TableName: this.props.reviewableTable,
                    Item: reviewableParam,
                }).promise()
            reviewable = reviewableParam
            console.log(reviewable)
        }

        const review = {
            id: uuidv4(),
            ...params,
            reviewableId: (reviewable ? reviewable.id : undefined)
        }

        const reviewResponse = await this.documentClient
            .put({
                TableName: this.props.reviewTable,
                Item: review,
            }).promise()

        console.log(review)
        return reviewResponse
    }

}
