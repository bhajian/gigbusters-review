import * as cdk from 'aws-cdk-lib';
import {CfnOutput, Fn, RemovalPolicy, Stack} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {GenericDynamoTable} from "../lib/generic/GenericDynamoTable";
import {AttributeType, StreamViewType} from "aws-cdk-lib/aws-dynamodb";
import config from "../config/config";
import {Bucket, HttpMethods} from "aws-cdk-lib/aws-s3";
import {Effect, PolicyStatement, Role} from "aws-cdk-lib/aws-iam";


export class ReviewableStatefulStack extends Stack {
    public dynamodbTable: GenericDynamoTable
    public reviewablePhotoBucket: Bucket
    private suffix: string;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        this.initializeSuffix()
        this.initializeDynamoDBTable()
        this.initializeReviewablePhotosBucket()
        this.initializeBucketPolicies()
    }

    private initializeSuffix() {
        const shortStackId = Fn.select(2, Fn.split('/', this.stackId));
        const Suffix = Fn.select(4, Fn.split('-', shortStackId));
        this.suffix = Suffix;
    }

    private initializeDynamoDBTable() {
        this.dynamodbTable = new GenericDynamoTable(this,
            'ReviewableDynamoDBTable', {
                removalPolicy: RemovalPolicy.DESTROY,
                tableName: `Reviewable-${config.envName}-${this.suffix}`,
                stream: StreamViewType.NEW_AND_OLD_IMAGES,
                primaryKey: 'uri',
                keyType: AttributeType.STRING,
                sortKeyName: 'type',
                sortKeyType: AttributeType.STRING
            })
        this.dynamodbTable.addSecondaryIndexes({
            indexName: 'userIdIndex',
            partitionKeyName: 'userId',
            partitionKeyType: AttributeType.STRING,
        })
    }

    private initializeReviewablePhotosBucket() {
        this.reviewablePhotoBucket = new Bucket(this, 'reviewable-photos', {
            removalPolicy: RemovalPolicy.DESTROY,
            bucketName: `reviewable-photos-${config.envName}-${this.suffix}`,
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
        new CfnOutput(this, 'reviewable-photos-bucket-name', {
            value: this.reviewablePhotoBucket.bucketName
        })
    }

    private initializeBucketPolicies() {
        const authenticatedRole = Role.fromRoleArn(
            this, `authenticatedRoleReviewable`, config.authenticatedRoleArn)
        const adminRole = Role.fromRoleArn(
            this, `adminRoleReviewable`, config.adminRoleArn)
        const uploadBucketPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                's3:PutObject',
                's3:PutObjectAcl',
                's3:GetObject',
                's3:DeleteObject'
            ],
            resources: [this.reviewablePhotoBucket.bucketArn + '/*']
        })
        authenticatedRole.addToPrincipalPolicy(uploadBucketPolicy)
        adminRole.addToPrincipalPolicy(uploadBucketPolicy)
    }

}
