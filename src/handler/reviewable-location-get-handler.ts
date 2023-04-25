import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {b64Decode, getEventBody, getPathParameter, getSub} from "../lib/utils";
import {Env} from "../lib/env";
import {ReviewableService} from "../service/reviewable-service";

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
        const id = getPathParameter(event, 'id')
        const sub = getSub(event)
        const decodedId = b64Decode(id).split(':')
        const type = decodedId[0]
        const uri = decodedId[1]

        if(!sub){
            throw new Error('Sub or userId is not passed through a token.')
        }

        const item = await service.getLocation({
            id: id,
            type: type,
            uri: uri,
            userId: sub,
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
