import { DocumentClient, ScanInput } from 'aws-sdk/clients/dynamodb'
import { v4 as uuidv4 } from 'uuid'
import {
    CategoryCreateParams,
    CategoryDeleteParams,
    CategoryPutParams,
    CategoryEntity,
    CategoryGetParams
} from "./types";

interface ProfileServiceProps{
    table: string
}

export class CategoryService {

    private props: ProfileServiceProps
    private documentClient = new DocumentClient()

    public constructor(props: ProfileServiceProps){
        this.props = props
    }

    async list(userId: string): Promise<CategoryEntity[]> {
        const response = await this.documentClient
            .scan({
                TableName: this.props.table,
                FilterExpression: 'ranking >= :ranking',
                ExpressionAttributeValues: {
                    ':ranking': 0
                },
            }).promise()
        if (response.Items === undefined) {
            return [] as CategoryEntity[]
        }
        return response.Items as CategoryEntity[]
    }

    async get(params: CategoryGetParams): Promise<CategoryEntity> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    name: params.name,
                },
            }).promise()
        return response.Item as CategoryEntity
    }

    async put(params: CategoryPutParams): Promise<CategoryEntity> {
        const response = await this.documentClient
            .put({
                TableName: this.props.table,
                Item: params,
            }).promise()
        return params
    }

    async delete(params: CategoryDeleteParams) {
        const response = await this.documentClient
            .delete({
                TableName: this.props.table,
                Key: {
                    name: params.name,
                },
            }).promise()
    }

}
