import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {Env} from "../lib/env";
import {b64Decode, getPathParameter, getSub} from "../lib/utils";
import {ReviewableService} from "../service/reviewable-service";
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
        body: 'Hello From Edit Api!'
    }
    try {
        const id = getPathParameter(event, 'reviewId')
        const photoId = getPathParameter(event, 'photoId')
        const sub = getSub(event)

        if(!sub){
            throw new Error('Sub or userId is not passed through a token.')
        }

        await service.deletePhoto({
            id: id,
            userId: sub,
        }, {
            photoId: photoId
        })
        result.body = JSON.stringify({success: true})
    } catch (error) {
        console.error(error.message)
        result.statusCode = 500
        result.body = error.message
    }
    return result
}
