import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Stack} from "aws-cdk-lib";
import {CategoryApis} from "../lib/construct/category-apis";
import {CategoryStatefulStack} from "./category-stateful-stack";

export interface TodoAppProps{
  categoryApiStatefulStack: CategoryStatefulStack
}

export class CategoryApiStack extends Stack {

  public categoryApis:CategoryApis

  constructor(scope: Construct, id: string, todoAppProps: TodoAppProps,  props?: cdk.StackProps) {
    super(scope, id, props);
    this.categoryApis = new CategoryApis(this,id, {
      dynamoDBTable: todoAppProps.categoryApiStatefulStack.dynamodbTable,
    })
  }


}
