import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {Env} from "../lib/env";
import {ReviewableService} from "../service/reviewable-service";
import {b64Decode, getPathParameter, getSub} from "../lib/utils";

const table = Env.get('TABLE')
const bucket = Env.get('IMAGE_BUCKET')
const profileTable = Env.get('PROFILE_TABLE')
const service = new ReviewableService({
    table: table,
    bucket: bucket,
    profileTable: profileTable
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
        const type = getPathParameter(event, 'type')
        const uri = getPathParameter(event, 'uri')

        if(!sub){
            throw new Error('Sub or userId is not passed through a token.')
        }

        const item = await service.get({
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
