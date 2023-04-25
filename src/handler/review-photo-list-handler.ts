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
        body: ''
    }
    try{
        const sub = getSub(event)
        const id = getPathParameter(event, 'reviewId')

        if(!sub){
            throw new Error('Sub or userId is not passed through a token.')
        }

        const photos = await service.listPhotos({
            id: id,
            userId: sub,
        })

        result.body = JSON.stringify(photos)
        return result
    }
    catch (e) {
        result.statusCode = 500
        result.body = e.message
    }
    return result
}
