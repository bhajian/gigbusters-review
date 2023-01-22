import { DocumentClient, ScanInput } from 'aws-sdk/clients/dynamodb'
import { v4 as uuidv4 } from 'uuid'
import {
    ReviewCreateParams,
    ReviewDeleteParams,
    ReviewPutParams,
    ReviewEntity,
    ReviewGetParams
} from "./types";

interface ReviewServiceProps{
    table: string
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
                TableName: this.props.table,
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

    async get(params: ReviewGetParams): Promise<ReviewEntity> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    name: params.name,
                },
            }).promise()
        return response.Item as ReviewEntity
    }

    async put(params: ReviewPutParams): Promise<ReviewEntity> {
        const response = await this.documentClient
            .put({
                TableName: this.props.table,
                Item: params,
            }).promise()
        return params
    }

    async delete(params: ReviewDeleteParams) {
        const response = await this.documentClient
            .delete({
                TableName: this.props.table,
                Key: {
                    name: params.name,
                },
            }).promise()
    }

}
