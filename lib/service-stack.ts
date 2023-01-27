import {Construct} from "constructs";
import {aws_lambda, Stack, StackProps} from "aws-cdk-lib";
import {Code, Runtime} from "aws-cdk-lib/aws-lambda";
import { HttpApi} from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';


export class ServiceStack extends Stack {
    public readonly serviceCode: Code
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.serviceCode = Code.fromCfnParameters();

        const lambda = new aws_lambda.Function(this, 'ServiceLambda', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'src/lambda.handler',
            code:this.serviceCode,
            functionName: 'ServiceLambda'
        });

        new HttpApi(this, 'ServiceAPI', {
            defaultIntegration: new HttpLambdaIntegration("LambdaIntegration", lambda),
            apiName: "MyAPIService"
        });
    }
}