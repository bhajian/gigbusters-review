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

export interface ApiProps {
    reviewTable: GenericDynamoTable
}

export interface AuthorizerProps {
    id: string
    authorizerName: string
    identitySource: string
    userPoolArn: string
}

export interface ReviewApiProps {
    reviewTable: Table
    reviewableTable: ITable
    authorizer: CognitoUserPoolsAuthorizer
    rootResource: IResource
    idResource: IResource
    complexReviewResource: IResource
}

export class ReviewApis extends GenericApi {
    private listApi: NodejsFunction
    private getApi: NodejsFunction
    private postApi: NodejsFunction
    private postComplexApi: NodejsFunction
    private putApi: NodejsFunction
    private deleteApi: NodejsFunction

    public constructor(scope: Construct, id: string, props: ApiProps) {
        super(scope, id)
        const reviewableTable = this.getRevieableTable(config.reviewableTableArn)

        this.initializeApis(props.reviewTable.table, reviewableTable)
        this.initializeDomainName({
            certificateArn: config.apiDomainCertificateArn,
            apiSubdomain: config.apiSubdomain,
            domainNameId: 'domainNameId',
            rootDomain: config.rootDomain,
            ARecordId: 'ARecordId',
            basePath: config.basePath,
            envName: config.envName
        })
    }

    private initializeApis(reviewTable: Table, reviewableTable: ITable){
        const authorizer = this.createAuthorizer({
            id: 'userAuthorizerId',
            authorizerName: 'userAuthorizer',
            identitySource: 'method.request.header.Authorization',
            userPoolArn: config.userPoolArn
        })

        const idResource = this.api.root.addResource('{reviewId}')
        const complexReviewResource = this.api.root.addResource('complexReview')

        this.initializeReviewApis({
            authorizer: authorizer,
            idResource: idResource,
            rootResource: this.api.root,
            reviewTable: reviewTable,
            reviewableTable: reviewableTable,
            complexReviewResource: complexReviewResource
        })
    }

    private initializeReviewApis(props: ReviewApiProps){
        this.listApi = this.addMethod({
            functionName: 'review-list',
            handlerName: 'review-list-handler.ts',
            verb: 'GET',
            resource: props.rootResource,
            environment: {
                TABLE: props.reviewTable.tableName,
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
                TABLE: props.reviewTable.tableName
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
                TABLE: props.reviewTable.tableName
            },
            validateRequestBody: true,
            bodySchema: postReviewSchema,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.postComplexApi = this.addMethod({
            functionName: 'review-post',
            handlerName: 'review-post-complex-handler.ts',
            verb: 'POST',
            resource: props.complexReviewResource,
            environment: {
                REVIEW_TABLE: props.reviewTable.tableName,
                REVIEWABLE_TABLE: props.reviewableTable.tableName
            },
            validateRequestBody: true,
            bodySchema: postReviewSchema,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.putApi = this.addMethod({
            functionName: 'review-put',
            handlerName: 'review-put-handler.ts',
            verb: 'PUT',
            resource: props.rootResource,
            environment: {
                TABLE: props.reviewTable.tableName
            },
            validateRequestBody: true,
            bodySchema: putReviewSchema,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.deleteApi = this.addMethod({
            functionName: 'review-delete',
            handlerName: 'review-delete-handler.ts',
            verb: 'DELETE',
            resource: props.idResource,
            environment: {
                TABLE: props.reviewTable.tableName
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
        props.reviewableTable.grantFullAccess(this.postComplexApi.grantPrincipal)
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

    protected getRevieableTable(reviewableTableArn: string): ITable {
        const reviewableTable = Table.fromTableArn(
            this,
            'reviewableTableId',
            reviewableTableArn)
        return reviewableTable
    }

}
