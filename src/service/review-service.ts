import { DocumentClient, ScanInput } from 'aws-sdk/clients/dynamodb'
import { v4 as uuidv4 } from 'uuid'
import {
    ComplexReviewEntity,
    ReviewEntity,
    ReviewKeyParams
} from "./review-types";

interface ReviewServiceProps{
    reviewTable: string
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
                    // FIX ME
                },
            }).promise()
    }

    async putComplexReview(params: ComplexReviewEntity): Promise<ReviewEntity | null> {
        // const response = await this.documentClient
        //     .put({
        //         TableName: this.props.reviewTable,
        //         Item: params,
        //     }).promise()
        return null
    }

}
