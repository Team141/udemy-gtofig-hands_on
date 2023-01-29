import * as cdk from 'aws-cdk-lib';
import {Match, Template} from 'aws-cdk-lib/assertions';
import * as Pipeline from '../lib/pipeline-stack';
import {expectProp} from "aws-cdk-lib/pipelines/lib/private/javascript";
import {ServiceStack} from "../lib/service-stack";
import {PipelineStack} from "../lib/pipeline-stack";

// example test. To run these tests, uncomment this file along with the
// example resource in lib/pipeline-stack.ts
test('Pipeline Stack', () => {
  const app = new cdk.App();
    // WHEN
  const stack = new Pipeline.PipelineStack(app, 'MyTestStack');
    // THEN
  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();

});

test( 'Adding service stage', () => {
  const app = new cdk.App();
  const serviceStack = new ServiceStack(app, 'ServiceStack');
  const pipelineStack = new PipelineStack(app, 'PipelineStack');

  pipelineStack.addServiceStage(serviceStack, 'Test');

  Template.fromStack(pipelineStack).hasResourceProperties("AWS::CodePipeline::Pipeline", {
    Stages: Match.arrayWith([Match.objectLike({
      Name: "Test",
    })])
  })
})
