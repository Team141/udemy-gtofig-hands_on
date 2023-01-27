import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as Pipeline from '../lib/pipeline-stack';
import {expectProp} from "aws-cdk-lib/pipelines/lib/private/javascript";

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
