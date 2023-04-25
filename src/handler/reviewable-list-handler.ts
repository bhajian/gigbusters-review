import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {Env} from "../lib/env";
import {ReviewableService} from "../service/reviewable-service";
import {b64Decode, getPathParameter, getQueryString, getSub} from "../lib/utils";

const table = Env.get('TABLE')
const bucket = Env.get('IMAGE_BUCKET')
const service = new ReviewableService({
    table: table,
    bucket: bucket
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
        const sub = getSub(event)
        const limit = getQueryString(event, 'limit')
        const lastEvaluatedKey = getQueryString(event, 'lastEvaluatedKey')

        const item = await service.list({
            limit: limit,
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
