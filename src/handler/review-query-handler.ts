import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {Env} from "../lib/env";
import {ReviewService} from "../service/review-service";
import {getQueryString, getSub} from "../lib/utils";

const reviewTable = Env.get('REVIEW_TABLE')
const reviewableTable = Env.get('REVIEWABLE_TABLE')
const service = new ReviewService({
    reviewTable: reviewTable,
    reviewableTable: reviewableTable
})

export async function handler(event: APIGatewayProxyEvent, context: Context):
    Promise<APIGatewayProxyResult> {

    const result: APIGatewayProxyResult = {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*'
        },
        body: ''
    }
    try{
        const userId = getSub(event)
        const uri = getQueryString(event, 'uri')
        const type = getQueryString(event, 'type')
        const limit = getQueryString(event, 'limit')
        const lastEvaluatedKey = getQueryString(event, 'lastEvaluatedKey')

        const item = await service.query({
            uri: uri,
            type: type,
            userId: userId,
            limit: (limit? limit : 50),
            lastEvaluatedKey: lastEvaluatedKey
        })

        result.body = JSON.stringify(item)
        return result
    }
    catch (e) {
        result.statusCode = 500
        result.body = e.message
    }
    return result
}
