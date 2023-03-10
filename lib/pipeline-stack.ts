import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Artifact, IStage, Pipeline} from "aws-cdk-lib/aws-codepipeline";
import {
  CloudFormationCreateUpdateStackAction,
  CodeBuildAction,
  GitHubSourceAction
} from "aws-cdk-lib/aws-codepipeline-actions";
import {SecretValue} from "aws-cdk-lib";
import {BuildSpec, LinuxBuildImage, PipelineProject} from "aws-cdk-lib/aws-codebuild";
import {ServiceStack} from "./service-stack";
import {BillingStack} from "./billing-stack";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class PipelineStack extends cdk.Stack {
  private readonly pipeline: Pipeline;
  private readonly cdkBuildOutput: Artifact;
  private readonly serviceBuildOutput: Artifact;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: 'Pipeline',
      crossAccountKeys: false,
      restartExecutionOnUpdate: true
    });

    const cdkSourceOutput = new Artifact('CDKSourceOutput')
    const serviceSourceOutput = new Artifact('ServiceSourceOutput')

    this.pipeline.addStage({
      stageName: 'Source',
      actions: [
          new GitHubSourceAction({
            owner: 'Team141',
            repo: 'udemy-gtofig-hands_on',
            branch: 'main',
            actionName: 'Pipeline_Source',
            oauthToken: SecretValue.secretsManager('github-token'),
            output: cdkSourceOutput
          }),
        new GitHubSourceAction({
          owner: 'Team141',
          repo: 'express-lambda',
          branch: 'main',
          actionName: 'Service_Source',
          oauthToken: SecretValue.secretsManager('github-token'),
          output: serviceSourceOutput
        })
      ]
    });

    this.cdkBuildOutput = new Artifact("CdkBuildOutput");
    this.serviceBuildOutput = new Artifact("ServiceBuildOutput");

    this.pipeline.addStage({
      stageName:'Build',
      actions:[
          new CodeBuildAction({
            actionName: 'CDK_Build',
            input: cdkSourceOutput,
            outputs: [this.cdkBuildOutput],
            project: new PipelineProject(this, 'CdkBuildProject', {
              environment: {
                buildImage: LinuxBuildImage.STANDARD_5_0
              },
              buildSpec:BuildSpec.fromSourceFilename('buildspec/cdk-build-spec.yml')
            })
          }),
        new CodeBuildAction({
          actionName: 'Service_Build',
          input: serviceSourceOutput,
          outputs: [this.serviceBuildOutput],
          project: new PipelineProject(this, 'ServiceBuildProject', {
            environment: {
              buildImage: LinuxBuildImage.STANDARD_5_0
            },
            buildSpec:BuildSpec.fromSourceFilename('buildspec/service-build-spec.yml')
          })
        })
      ]
    });

    this.pipeline.addStage({
      stageName: "Pipeline_update",
      actions: [
          new CloudFormationCreateUpdateStackAction({
            actionName: "Pipeline_Update",
            stackName: "PipelineStack",
            templatePath: this.cdkBuildOutput.atPath("PipelineStack.template.json"),
            adminPermissions:true,
          }),
      ],
    });

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'PipelineQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }

  public addServiceStage(serviceStack: ServiceStack, stageName: string): IStage {
    return this.pipeline.addStage({
      stageName:stageName,
      actions: [
          new CloudFormationCreateUpdateStackAction({
            actionName: "service_update",
            stackName: serviceStack.stackName,
            templatePath: this.cdkBuildOutput.atPath(`${serviceStack.stackName}.template.json`),
            adminPermissions: true,
            parameterOverrides: {
              ...serviceStack.serviceCode.assign(this.serviceBuildOutput.s3Location),
            },
            extraInputs: [this.serviceBuildOutput],
          }),
      ],
    });
  };

  public addBillingStackToStage(billingStack: BillingStack, stage: IStage) {
    stage.addAction(new CloudFormationCreateUpdateStackAction({
      actionName: "Billing_update",
      stackName: billingStack.stackName,
      templatePath: this.cdkBuildOutput.atPath(`${billingStack.stackName}.template.json`),
      adminPermissions: true
    }))
  };
}
