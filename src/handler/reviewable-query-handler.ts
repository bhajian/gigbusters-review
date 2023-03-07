import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {Env} from "../lib/env";
import {ReviewableService} from "../service/reviewable-service";
import {getQueryString, getSub} from "../lib/utils";

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
        const userId = getSub(event)
        const userParam = getQueryString(event, 'user')
        const typeParam = getQueryString(event, 'type')
        const uriParam = getQueryString(event, 'uri')
        const categoryParam = getQueryString(event, 'category')
        const distanceParam = getQueryString(event, 'distance')
        const longitudeParam = getQueryString(event, 'longitude')
        const latitudeParam = getQueryString(event, 'latitude')
        const items = await service.query({
            userId: (userParam? userId : undefined),
            type: typeParam,
            uri: uriParam,
            category: categoryParam,
            distance: distanceParam,
            longitude: longitudeParam,
            latitude: latitudeParam
        })

        result.body = JSON.stringify(items)
        return result
    }
    catch (e) {
        result.statusCode = 500
        result.body = e.message
    }
    return result
}