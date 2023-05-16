#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {ReviewApiStack} from '../stack/review-api-stack';
import {ReviewStatefulStack} from "../stack/review-stateful-stack";
import {ReviewableApiStack} from "../stack/reviewable-api-stack";
import {ReviewableStatefulStack} from "../stack/reviewable-stateful-stack";
import config from "../config/config";

const app = new cdk.App();

const reviewableStatefulStack = new ReviewableStatefulStack(
    app, `ReviewableStatefulStack-${config.envName}`, {
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION
        }
    })

const reviewStatefulStack = new ReviewStatefulStack(
    app, `ReviewStatefulStack-${config.envName}`, {
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION
        }
    })

new ReviewableApiStack(app, `ReviewableApiStack-${config.envName}`, {
    reviewApiStatefulStack: reviewStatefulStack,
    reviewableApiStatefulStack: reviewableStatefulStack,
}, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
})

new ReviewApiStack(app, `ReviewApiStack-${config.envName}`, {
    reviewApiStatefulStack: reviewStatefulStack,
    reviewableApiStatefulStack: reviewableStatefulStack
}, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
})


