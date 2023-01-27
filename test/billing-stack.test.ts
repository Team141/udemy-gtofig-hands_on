import {App} from "aws-cdk-lib";
import {BillingStack} from "../lib/billing-stack";
import {Match, Template} from "aws-cdk-lib/assertions";

test('Billing Stack Snaphot', () =>{
    const app = new App();
    const stack = new BillingStack(app, 'BillingStackSnap', {
        budgetAmount: 1,
        emailAddress: "test@example.com"
    });

    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();


});