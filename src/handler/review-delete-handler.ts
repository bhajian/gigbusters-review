import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {getEventBody, getPathParameter, getSub} from "../lib/utils";
import {Env} from "../lib/env";
import {ReviewService} from "../service/review-service";
import {ReviewEntity} from "../service/review-types";

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
        body: 'Hello From Api!'
    }
    try {
        const id = getPathParameter(event, 'id')
        const userId = getSub(event)
        await service.delete({id, userId: userId})
        result.body = JSON.stringify({success: true})
    } catch (error) {
        result.statusCode = 500
        result.body = error.message
    }
    return result
}
