#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {ReviewApiStack} from '../stack/review-api-stack';
import {ReviewStatefulStack} from "../stack/review-stateful-stack";
import {ReviewableApiStack} from "../stack/reviewable-api-stack";
import {ReviewableStatefulStack} from "../stack/reviewable-stateful-stack";

const app = new cdk.App();

const reviewableStatefulStack = new ReviewableStatefulStack(
    app, 'ReviewableStatefulStack', {
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION
        }
    })

const reviewStatefulStack = new ReviewStatefulStack(
    app, 'ReviewStatefulStack', {
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION
        }
    })

new ReviewableApiStack(app, 'ReviewableApiStack', {
    reviewApiStatefulStack: reviewStatefulStack,
    reviewableApiStatefulStack: reviewableStatefulStack,
}, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
})

new ReviewApiStack(app, 'ReviewApiStack', {
    reviewApiStatefulStack: reviewStatefulStack,
    reviewableApiStatefulStack: reviewableStatefulStack
}, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
})


