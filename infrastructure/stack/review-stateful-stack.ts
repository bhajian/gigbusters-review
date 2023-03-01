import * as cdk from 'aws-cdk-lib';
import {CfnOutput, Fn, RemovalPolicy, Stack} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {GenericDynamoTable} from "../lib/generic/GenericDynamoTable";
import {AttributeType, StreamViewType} from "aws-cdk-lib/aws-dynamodb";
import config from "../config/config";
import {Bucket, HttpMethods} from "aws-cdk-lib/aws-s3";
import {Effect, PolicyStatement, Role} from "aws-cdk-lib/aws-iam";


export class ReviewStatefulStack extends Stack {
    public dynamodbTable: GenericDynamoTable
    public reviewPhotoBucket: Bucket
    private suffix: string;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        this.initializeSuffix()
        this.initializeDynamoDBTable()
        this.initializeReviewPhotosBucket()
        this.initializeBucketPolicies()
    }

    private initializeSuffix() {
        const shortStackId = Fn.select(2, Fn.split('/', this.stackId));
        const Suffix = Fn.select(4, Fn.split('-', shortStackId));
        this.suffix = Suffix;
    }

    private initializeDynamoDBTable() {
        this.dynamodbTable = new GenericDynamoTable(this, 'ReviewDynamoDBTable', {
            removalPolicy: RemovalPolicy.DESTROY,
            tableName: `Review-${config.envName}-${this.suffix}`,
            stream: StreamViewType.NEW_AND_OLD_IMAGES,
            primaryKey: 'id',
            keyType: AttributeType.STRING
        })
        this.dynamodbTable.addSecondaryIndexes({
            indexName: 'userIdIndex',
            partitionKeyName: 'userId',
            partitionKeyType: AttributeType.STRING,
        })
        this.dynamodbTable.addSecondaryIndexes({
            indexName: 'reviewableIdIndex',
            partitionKeyName: 'reviewableId',
            partitionKeyType: AttributeType.STRING,
        })
    }

    private initializeReviewPhotosBucket() {
        this.reviewPhotoBucket = new Bucket(this, 'review-photos', {
            removalPolicy: RemovalPolicy.DESTROY,
            bucketName: `review-photos-${config.envName}-${this.suffix}`,
            cors: [{
                allowedMethods: [
                    HttpMethods.HEAD,
                    HttpMethods.GET,
                    HttpMethods.PUT
                ],
                allowedOrigins: ['*'],
                allowedHeaders: ['*']
            }]
        });
        new CfnOutput(this, 'review-photos-bucket-name', {
            value: this.reviewPhotoBucket.bucketName
        })
    }

    private initializeBucketPolicies() {
        const authenticatedRole = Role.fromRoleArn(
            this, 'authenticatedRole', config.authenticatedRoleArn)
        const adminRole = Role.fromRoleArn(
            this, 'adminRole', config.adminRoleArn)
        const uploadBucketPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                's3:PutObject',
                's3:PutObjectAcl',
                's3:GetObject',
                's3:DeleteObject'
            ],
            resources: [this.reviewPhotoBucket.bucketArn + '/*']
        })
        authenticatedRole.addToPrincipalPolicy(uploadBucketPolicy)
        adminRole.addToPrincipalPolicy(uploadBucketPolicy)
    }

}
