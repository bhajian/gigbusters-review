import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Stack} from "aws-cdk-lib";
import {ReviewApis} from "../lib/construct/review-apis";
import {ReviewStatefulStack} from "./review-stateful-stack";

export interface ReviewAppProps {
    reviewApiStatefulStack: ReviewStatefulStack
}

export class ReviewApiStack extends Stack {

    public reviewApis: ReviewApis

    constructor(scope: Construct, id: string, todoAppProps: ReviewAppProps,
                props?: cdk.StackProps) {
        super(scope, id, props);
        this.reviewApis = new ReviewApis(this, id, {
            reviewTable: todoAppProps.reviewApiStatefulStack.dynamodbTable,
        })
    }
}
