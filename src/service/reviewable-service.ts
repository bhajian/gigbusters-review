import { DocumentClient, ScanInput } from 'aws-sdk/clients/dynamodb'
import { v4 as uuidv4 } from 'uuid'
import {
    LocationEntry, PhotoEntry,
    ReviewableEntity,
    ReviewableKeyParams
} from "./reviewable-types";
import {b64Encode} from "../lib/utils";

interface ReviewableServiceProps{
    table: string
    bucket: string
    profileTable?: string
}

export class ReviewableService {

    private props: ReviewableServiceProps
    private documentClient = new DocumentClient()

    public constructor(props: ReviewableServiceProps){
        this.props = props
    }

    async list(): Promise<ReviewableEntity[]> {
        const response = await this.documentClient
            .scan({
                TableName: this.props.table,
            }).promise()
        if (response.Items === undefined) {
            return [] as ReviewableEntity[]
        }
        return response.Items as ReviewableEntity[]
    }

    async query(params: any): Promise<ReviewableEntity[]> {
        try{
            const {userId, uri, location, category, type} = params
            if(userId){
                const response = await this.documentClient
                    .query({
                        TableName: this.props.table,
                        IndexName: 'userIdIndex',
                        KeyConditionExpression: 'userId = :userId',
                        ExpressionAttributeValues : {
                            ':userId' : userId,
                        }
                    }).promise()
                return response.Items as ReviewableEntity[]
            }
            if(type){ // FIX me : what if combination of query parameters are requested
                const response = await this.documentClient
                    .query({
                        TableName: this.props.table,
                        KeyConditionExpression: '#type = :type',
                        ExpressionAttributeNames: {
                            '#type': 'type'
                        },
                        ExpressionAttributeValues : {
                            ':type' : type,
                        }
                    }).promise()
                return response.Items as ReviewableEntity[]
            }
            return [] as ReviewableEntity[]
            if(location){
                // FIX ME
            }
            if(category){
                // FIX ME
            }
        } catch (e) {
            throw e
        }
    }

    async get(params: ReviewableKeyParams): Promise<ReviewableEntity> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    uri: params.uri,
                    type: params.type
                },
            }).promise()
        return response.Item as ReviewableEntity
    }

    async create(params: ReviewableEntity): Promise<ReviewableEntity> {
        const now = new Date()
        params.reviewableStatus = 'active'
        params.createdDateTime = now.toISOString()
        await this.documentClient
            .put({
                TableName: this.props.table,
                Item: params,
            }).promise()
        return params
    }

    async put(params: ReviewableEntity): Promise<ReviewableEntity> {
        const response = await this.documentClient
            .put({
                TableName: this.props.table,
                Item: params,
                ConditionExpression: 'userId = :userId',
                ExpressionAttributeValues : {':userId' : params.userId}
            }).promise()
        return params
    }

    async delete(params: ReviewableEntity) {
        const response = await this.documentClient
            .delete({
                TableName: this.props.table,
                Key: {
                    uri: params.uri,
                    type: params.type,
                },
                ConditionExpression: 'userId = :userId',
                ExpressionAttributeValues : {':userId' : params.userId}
            }).promise()
    }

    async setLocation(params: ReviewableKeyParams, location: LocationEntry):
        Promise<any> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    uri: params.uri,
                    type: params.type
                },
            }).promise()
        const reviewable = response.Item
        if (reviewable && reviewable.userId === params.userId) {
            reviewable.location = location
            await this.documentClient
                .put({
                    TableName: this.props.table,
                    Item: reviewable,
                    ConditionExpression: 'userId = :userId',
                    ExpressionAttributeValues : {':userId' : params.userId}
                }).promise()
        }
    }

    async batchGetProfiles(userIds: any): Promise<any> {
        const requestItems: any = {}
        let profiles = new Map<string, any>()
        if (userIds.length === 0 ){
            return profiles
        }

        if(!this.props.profileTable){
            throw new Error('Profile Table is not provided as an environment variable.')
        }

        requestItems[this.props.profileTable] = {
            Keys: userIds
        }
        const userResponse = await this.documentClient
            .batchGet({
                RequestItems: requestItems
            }).promise()
        let rawProfiles: any = []
        if(userResponse && userResponse.Responses && userResponse.Responses[this.props.profileTable]){
            rawProfiles = userResponse.Responses[this.props.profileTable]
            for(let i=0; i< rawProfiles.length; i++){
                profiles.set(rawProfiles[i].userId, rawProfiles[i])
            }
        }
        return profiles
    }

    async getLocation(params: ReviewableKeyParams): Promise<LocationEntry | {}> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    uri: params.uri,
                    type: params.type
                },
            }).promise()
        const reviewable = response.Item
        if (reviewable && reviewable.location && reviewable.userId === params.userId) {
            return reviewable.location
        }
        return {}
    }

    async listPhotos(params: ReviewableKeyParams): Promise<PhotoEntry[]> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    uri: params.uri,
                    type: params.type
                },
            }).promise()
        if (response.Item === undefined ||
            response.Item.photos === undefined ||
            response.Item.userId != params.userId) {
            return [] as PhotoEntry[]
        }
        return response.Item.photos as PhotoEntry[]
    }

    async getPhoto(params: ReviewableKeyParams, photoParams: PhotoEntry): Promise<PhotoEntry | {}> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    uri: params.uri,
                    type: params.type
                },
            }).promise()
        if (response.Item && response.Item.photos &&
            response.Item.userId == params.userId) {
            const photo = response.Item.photos.find(
                (item: PhotoEntry) => item.photoId === photoParams.photoId)
            if (!photo)
                return {}
            return photo
        }
        return {}
    }

    async addPhoto(params: ReviewableKeyParams, photoParams: PhotoEntry): Promise<PhotoEntry> {
        const photoId = uuidv4()
        const newPhoto = {
            photoId: photoId,
            bucket: this.props.bucket,
            key: `${params.type}/${params.uri}/photos/${photoId}`,
            type: photoParams.type
        }
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    uri: params.uri,
                    type: params.type
                },
            }).promise()
        if (response.Item && response.Item.userId === params.userId) {
            if(response.Item.photos){
                response.Item.photos.push(newPhoto)
            } else{
                response.Item.photos = [newPhoto]
            }
            await this.documentClient
                .put({
                    TableName: this.props.table,
                    Item: response.Item,
                    ConditionExpression: 'userId = :userId',
                    ExpressionAttributeValues : {':userId' : params.userId}
                }).promise()
        } else{
            throw new Error('The profile was not found for this accountId' +
                ' or the user did not match the profile owner.')
        }
        return newPhoto
    }

    async deletePhoto(params: ReviewableKeyParams, photoParams: PhotoEntry) {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    uri: params.uri,
                    type: params.type
                },
            }).promise()
        const profile = response.Item
        if (profile && profile.photos && profile.userId === params.userId) {
            const photosWithoutItem = profile.photos
                .filter((item: PhotoEntry) => item.photoId != photoParams.photoId)
            profile.photos = photosWithoutItem
            await this.documentClient
                .put({
                    TableName: this.props.table,
                    Item: profile,
                    ConditionExpression: 'userId = :userId',
                    ExpressionAttributeValues : {':userId' : params.userId}
                }).promise()
        }
    }

}
