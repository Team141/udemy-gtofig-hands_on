import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Artifact, Pipeline} from "aws-cdk-lib/aws-codepipeline";
import {CodeBuildAction, GitHubSourceAction} from "aws-cdk-lib/aws-codepipeline-actions";
import {SecretValue} from "aws-cdk-lib";
import {BuildSpec, LinuxBuildImage, PipelineProject} from "aws-cdk-lib/aws-codebuild";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: 'Pipeline',
      crossAccountKeys: false
    });

    const sourceOutput = new Artifact('SourceOutput')

    pipeline.addStage({
      stageName: 'Source',
      actions: [
          new GitHubSourceAction({
            owner: 'Team141',
            repo: 'udemy-gtofig-hands_on',
            branch: 'main',
            actionName: 'Pipeline_Source',
            oauthToken: SecretValue.secretsManager('github-token'),
            output: sourceOutput
          })
      ]
    });

    const cdkbuildOutput = new Artifact("CdkBuildOutput");

    pipeline.addStage({
      stageName:'Build',
      actions:[
          new CodeBuildAction({
            actionName: 'CDK_Build',
            input: sourceOutput,
            outputs: [cdkbuildOutput],
            project: new PipelineProject(this, 'CdkBuildProject', {
              environment: {
                buildImage: LinuxBuildImage.STANDARD_5_0
              },
              buildSpec:BuildSpec.fromSourceFilename('buildspec/cdk-build-spec.yml')
            })
          })
      ]
    })

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'PipelineQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
