import * as cdk from 'aws-cdk-lib';
import {Fn, Stack} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {GenericDynamoTable} from "../lib/generic/GenericDynamoTable";
import {AttributeType, StreamViewType} from "aws-cdk-lib/aws-dynamodb";
import config from "../config/config";


export class CategoryStatefulStack extends Stack {
    public dynamodbTable: GenericDynamoTable
    private suffix: string;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        this.initializeSuffix()
        this.initializeDynamoDBTable()
    }

    private initializeSuffix() {
        const shortStackId = Fn.select(2, Fn.split('/', this.stackId));
        const Suffix = Fn.select(4, Fn.split('-', shortStackId));
        this.suffix = Suffix;
    }

    private initializeDynamoDBTable() {
        this.dynamodbTable = new GenericDynamoTable(this, 'CategoryDynamoDBTable', {
            tableName: `Category-${config.envName}-${this.suffix}`,
            primaryKey: 'name',
            stream: StreamViewType.NEW_AND_OLD_IMAGES,
            keyType: AttributeType.STRING
        })
        this.dynamodbTable.addSecondaryIndexes({
            indexName: 'rankIndex',
            partitionKeyName: 'name',
            partitionKeyType: AttributeType.STRING,
            sortKeyName: 'ranking',
            sortKeyType: AttributeType.NUMBER,
        })
    }

}
