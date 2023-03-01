import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {getEventBody, getSub} from "../lib/utils";
import {Env} from "../lib/env";
import {ReviewService} from "../service/review-service";
import {ComplexReviewEntity} from "../service/types";

const reviewTable = Env.get('REVIEW_TABLE')
const service = new ReviewService({
    reviewTable: reviewTable
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
        body: 'Hello From Todo Edit Api!'
    }
    try {
        const item = getEventBody(event) as ComplexReviewEntity;
        const sub = getSub(event)
        item.userId = sub
        const res = await service.putComplexReview(item)
        result.body = JSON.stringify(res)
    } catch (error) {
        result.statusCode = 500
        result.body = error.message
    }
    return result
}
