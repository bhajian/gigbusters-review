#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CategoryApiStack } from '../stack/category-api-stack';
import {CategoryStatefulStack} from "../stack/category-stateful-stack";

const app = new cdk.App();

const statefulStack = new CategoryStatefulStack(app, 'CategoryStatefulStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }})
new CategoryApiStack(app, 'CategoryApiStack', {
    categoryApiStatefulStack: statefulStack,
}, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});
