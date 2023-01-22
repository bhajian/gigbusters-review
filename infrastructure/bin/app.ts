#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ReviewApiStack } from '../stack/review-api-stack';
import {ReviewStatefulStack} from "../stack/review-stateful-stack";

const app = new cdk.App();

const statefulStack = new ReviewStatefulStack(app, 'ReviewStatefulStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }})
new ReviewApiStack(app, 'ReviewApiStack', {
    reviewApiStatefulStack: statefulStack,
}, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});
