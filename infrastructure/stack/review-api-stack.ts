import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Stack} from "aws-cdk-lib";
import {ReviewApis} from "../lib/construct/review-apis";
import {ReviewStatefulStack} from "./review-stateful-stack";
import {ReviewableStatefulStack} from "./reviewable-stateful-stack";

export interface ReviewAppProps {
    reviewApiStatefulStack: ReviewStatefulStack
    reviewableApiStatefulStack: ReviewableStatefulStack
}

export class ReviewApiStack extends Stack {

    public reviewApis: ReviewApis

    constructor(scope: Construct, id: string, reviewAppProps: ReviewAppProps,
                props?: cdk.StackProps) {
        super(scope, id, props);
        this.reviewApis = new ReviewApis(this, id, {
            reviewTable: reviewAppProps.reviewApiStatefulStack.dynamodbTable,
            reviewableTable: reviewAppProps.reviewableApiStatefulStack.dynamodbTable,
            reviewImageBucket: reviewAppProps.reviewApiStatefulStack
                .reviewPhotoBucket
        })
    }
}
