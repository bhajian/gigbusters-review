import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {b64Decode, getEventBody, getPathParameter, getSub} from "../lib/utils";
import {Env} from "../lib/env";
import {PhotoEntry} from "../service/reviewable-types";
import {ReviewService} from "../service/review-service";

const reviewTable = Env.get('REVIEW_TABLE')
const reviewableTable = Env.get('REVIEWABLE_TABLE')
const bucket = Env.get('IMAGE_BUCKET')
const service = new ReviewService({
    reviewTable: reviewTable,
    reviewableTable: reviewableTable,
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
        body: 'Empty!'
    }
    try {
        const id = getPathParameter(event, 'reviewId')
        const sub = getSub(event)
        const item = getEventBody(event) as PhotoEntry

        if(!sub){
            throw new Error('Sub or userId is not passed through a token.')
        }

        const newPhoto = await service.addPhoto({
            id: id,
            userId: sub,
        }, item)
        result.body = JSON.stringify(newPhoto)
    } catch (error) {
        result.statusCode = 500
        result.body = error.message
    }
    return result
}
