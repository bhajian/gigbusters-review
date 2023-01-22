import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Stack} from "aws-cdk-lib";
import {ReviewApis} from "../lib/construct/review-apis";
import {ReviewStatefulStack} from "./review-stateful-stack";

export interface TodoAppProps{
  reviewApiStatefulStack: ReviewStatefulStack
}

export class ReviewApiStack extends Stack {

  public categoryApis:ReviewApis

  constructor(scope: Construct, id: string, todoAppProps: TodoAppProps,  props?: cdk.StackProps) {
    super(scope, id, props);
    this.categoryApis = new ReviewApis(this,id, {
      dynamoDBTable: todoAppProps.reviewApiStatefulStack.dynamodbTable,
    })
  }


}
