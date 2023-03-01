import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Stack} from "aws-cdk-lib";
import {ReviewableApis} from "../lib/construct/reviewable-apis";
import {ReviewableStatefulStack} from "./reviewable-stateful-stack";
import {ReviewStatefulStack} from "./review-stateful-stack";

export interface ReviewableApiStackProps {
    reviewableApiStatefulStack: ReviewableStatefulStack
    reviewApiStatefulStack: ReviewStatefulStack
}

export class ReviewableApiStack extends Stack {

    public reviewableApis: ReviewableApis

    constructor(scope: Construct, id: string, reviewableApiProps:
        ReviewableApiStackProps, props?: cdk.StackProps) {
        super(scope, id, props);
        this.reviewableApis = new ReviewableApis(this, id, {
            reviewTable: reviewableApiProps.reviewApiStatefulStack.dynamodbTable,
            reviewableTable: reviewableApiProps.reviewableApiStatefulStack.dynamodbTable,
            reviewableImageBucket: reviewableApiProps.reviewableApiStatefulStack
                .reviewablePhotoBucket
        })
    }


}
