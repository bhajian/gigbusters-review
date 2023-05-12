import {Construct} from "constructs";
import {GenericDynamoTable} from "../generic/GenericDynamoTable";
import {GenericApi} from "../generic/GenericApi";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {putReviewSchema, postReviewSchema} from "./review-schema";
import {CognitoUserPoolsAuthorizer, IResource} from "aws-cdk-lib/aws-apigateway";
import {AuthorizationType} from "@aws-cdk/aws-apigateway";
import config from "../../config/config";
import {ITable, Table} from "aws-cdk-lib/aws-dynamodb";
import {UserPool} from "aws-cdk-lib/aws-cognito";
import {Bucket} from "aws-cdk-lib/aws-s3";

export interface ApiProps {
    reviewTable: GenericDynamoTable
    reviewableTable: GenericDynamoTable
    reviewImageBucket: Bucket
}

export interface AuthorizerProps {
    id: string
    authorizerName: string
    identitySource: string
    userPoolArn: string
}

export interface ReviewApiProps {
    reviewTable: Table
    reviewableTable: Table
    authorizer: CognitoUserPoolsAuthorizer
    rootResource: IResource
    idResource: IResource
    photoResource: IResource
    photoIdResource: IResource
    complexReviewResource: IResource
    queryResource: IResource
    reviewImageBucket: Bucket
}

export class ReviewApis extends GenericApi {
    private queryApi: NodejsFunction
    private listApi: NodejsFunction
    private getApi: NodejsFunction
    private postApi: NodejsFunction
    private postComplexApi: NodejsFunction
    private putApi: NodejsFunction
    private deleteApi: NodejsFunction

    private addPhotoApi: NodejsFunction
    private deletePhotoApi: NodejsFunction
    private listPhotosApi: NodejsFunction
    private getPhotosApi: NodejsFunction

    public constructor(scope: Construct, id: string, props: ApiProps) {
        super(scope, id)

        this.initializeApis(props.reviewTable.table, props.reviewableTable.table, props.reviewImageBucket)
        this.initializeDomainName({
            certificateArn: config.apiDomainCertificateArn,
            apiSubdomain: config.apiSubdomain,
            domainNameId: 'domainNameId',
            rootDomain: config.rootDomain,
            ARecordId: 'ARecordId',
            basePath: config.reviewApiBasePath,
            envName: config.envName
        })
    }

    private initializeApis(reviewTable: Table, reviewableTable: Table, reviewImageBucket: Bucket){
        const authorizer = this.createAuthorizer({
            id: 'userAuthorizerId',
            authorizerName: 'userAuthorizer',
            identitySource: 'method.request.header.Authorization',
            userPoolArn: config.userPoolArn
        })

        const idResource = this.api.root.addResource('{reviewId}')
        const complexReviewResource = this.api.root.addResource('complexReview')
        const queryResource = this.api.root.addResource('query')
        const photoResource = idResource.addResource('photo')
        const photoIdResource = photoResource.addResource('{photoId}')

        this.initializeReviewApis({
            authorizer: authorizer,
            idResource: idResource,
            rootResource: this.api.root,
            reviewTable: reviewTable,
            reviewableTable: reviewableTable,
            complexReviewResource: complexReviewResource,
            queryResource: queryResource,
            photoResource: photoResource,
            photoIdResource: photoIdResource,
            reviewImageBucket: reviewImageBucket
        })
    }

    private initializeReviewApis(props: ReviewApiProps){
        const profileITable = this.getProfileTable()

        this.listApi = this.addMethod({
            functionName: 'review-list',
            handlerName: 'review-list-handler.ts',
            verb: 'GET',
            resource: props.rootResource,
            environment: {
                REVIEW_TABLE: props.reviewTable.tableName,
                REVIEWABLE_TABLE: props.reviewableTable.tableName,
                PROFILE_TABLE: profileITable.tableName,
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.queryApi = this.addMethod({
            functionName: 'review-query',
            handlerName: 'review-query-handler.ts',
            verb: 'GET',
            resource: props.queryResource,
            environment: {
                REVIEW_TABLE: props.reviewTable.tableName,
                REVIEWABLE_TABLE: props.reviewableTable.tableName,
                PROFILE_TABLE: profileITable.tableName,
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.getApi = this.addMethod({
            functionName: 'review-get',
            handlerName: 'review-get-handler.ts',
            verb: 'GET',
            resource: props.idResource,
            environment: {
                REVIEW_TABLE: props.reviewTable.tableName,
                REVIEWABLE_TABLE: props.reviewableTable.tableName,
                PROFILE_TABLE: profileITable.tableName,
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.postApi = this.addMethod({
            functionName: 'review-post',
            handlerName: 'review-post-handler.ts',
            verb: 'POST',
            resource: props.rootResource,
            environment: {
                REVIEW_TABLE: props.reviewTable.tableName,
                REVIEWABLE_TABLE: props.reviewableTable.tableName
            },
            validateRequestBody: true,
            // bodySchema: postReviewSchema,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.postComplexApi = this.addMethod({
            functionName: 'review-post-complex',
            handlerName: 'review-post-complex-handler.ts',
            verb: 'POST',
            resource: props.complexReviewResource,
            environment: {
                REVIEW_TABLE: props.reviewTable.tableName,
                REVIEWABLE_TABLE: props.reviewableTable.tableName
            },
            validateRequestBody: true,
            // bodySchema: postReviewSchema,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.putApi = this.addMethod({
            functionName: 'review-put',
            handlerName: 'review-put-handler.ts',
            verb: 'PUT',
            resource: props.rootResource,
            environment: {
                REVIEW_TABLE: props.reviewTable.tableName,
                REVIEWABLE_TABLE: props.reviewableTable.tableName
            },
            validateRequestBody: true,
            // bodySchema: putReviewSchema,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.deleteApi = this.addMethod({
            functionName: 'review-delete',
            handlerName: 'review-delete-handler.ts',
            verb: 'DELETE',
            resource: props.idResource,
            environment: {
                REVIEW_TABLE: props.reviewTable.tableName,
                REVIEWABLE_TABLE: props.reviewableTable.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.listPhotosApi = this.addMethod({
            functionName: 'review-photo-list',
            handlerName: 'review-photo-list-handler.ts',
            verb: 'GET',
            resource: props.photoResource,
            environment: {
                REVIEW_TABLE: props.reviewTable.tableName,
                REVIEWABLE_TABLE: props.reviewableTable.tableName,
                IMAGE_BUCKET: props.reviewImageBucket.bucketName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.getPhotosApi = this.addMethod({
            functionName: 'review-photo-get',
            handlerName: 'review-photo-get-handler.ts',
            verb: 'GET',
            resource: props.photoIdResource,
            environment: {
                REVIEW_TABLE: props.reviewTable.tableName,
                REVIEWABLE_TABLE: props.reviewableTable.tableName,
                IMAGE_BUCKET: props.reviewImageBucket.bucketName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.addPhotoApi = this.addMethod({
            functionName: 'review-photo-add',
            handlerName: 'review-photo-add-handler.ts',
            verb: 'POST',
            resource: props.photoResource,
            environment: {
                REVIEW_TABLE: props.reviewTable.tableName,
                REVIEWABLE_TABLE: props.reviewableTable.tableName,
                IMAGE_BUCKET: props.reviewImageBucket.bucketName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.deletePhotoApi = this.addMethod({
            functionName: 'review-photo-delete',
            handlerName: 'review-photo-delete-handler.ts',
            verb: 'DELETE',
            resource: props.photoIdResource,
            environment: {
                REVIEW_TABLE: props.reviewTable.tableName,
                REVIEWABLE_TABLE: props.reviewableTable.tableName,
                IMAGE_BUCKET: props.reviewImageBucket.bucketName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        props.reviewTable.grantFullAccess(this.listApi.grantPrincipal)
        props.reviewTable.grantFullAccess(this.getApi.grantPrincipal)
        props.reviewTable.grantFullAccess(this.postApi.grantPrincipal)
        props.reviewTable.grantFullAccess(this.putApi.grantPrincipal)
        props.reviewTable.grantFullAccess(this.deleteApi.grantPrincipal)
        props.reviewTable.grantFullAccess(this.postComplexApi.grantPrincipal)
        props.reviewTable.grantFullAccess(this.queryApi.grantPrincipal)
        props.reviewableTable.grantFullAccess(this.postComplexApi.grantPrincipal)
        props.reviewableTable.grantFullAccess(this.queryApi.grantPrincipal)

        props.reviewTable.grantFullAccess(this.addPhotoApi.grantPrincipal)
        props.reviewableTable.grantFullAccess(this.addPhotoApi.grantPrincipal)
        props.reviewTable.grantFullAccess(this.deletePhotoApi.grantPrincipal)
        props.reviewableTable.grantFullAccess(this.deletePhotoApi.grantPrincipal)
        props.reviewTable.grantFullAccess(this.listPhotosApi.grantPrincipal)
        props.reviewableTable.grantFullAccess(this.listPhotosApi.grantPrincipal)
        props.reviewTable.grantFullAccess(this.getPhotosApi.grantPrincipal)
        props.reviewableTable.grantFullAccess(this.getPhotosApi.grantPrincipal)

        profileITable.grantFullAccess(this.queryApi.grantPrincipal)
        profileITable.grantFullAccess(this.listApi.grantPrincipal)
        profileITable.grantFullAccess(this.getApi.grantPrincipal)
    }

    protected createAuthorizer(props: AuthorizerProps): CognitoUserPoolsAuthorizer{
        const userPool = UserPool.fromUserPoolArn(this,'userPoolId', props.userPoolArn)
        const authorizer = new CognitoUserPoolsAuthorizer(
            this,
            props.id,
            {
                cognitoUserPools: [userPool],
                authorizerName: props.authorizerName,
                identitySource: props.identitySource
            });
        authorizer._attachToApi(this.api)
        return authorizer
    }

    public getProfileTable() : ITable {
        return Table.fromTableArn(this, 'profileTableId', config.profileTableArn)
    }

}
