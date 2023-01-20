import {JsonSchemaType} from "aws-cdk-lib/aws-apigateway";

export const putCategorySchema = {
    type: JsonSchemaType.OBJECT,
    required: [
        "name", "ranking"
    ],
    properties: {
        name: {
            type: JsonSchemaType.STRING
        },
        ranking: {
            type: JsonSchemaType.NUMBER
        },
    },
}
