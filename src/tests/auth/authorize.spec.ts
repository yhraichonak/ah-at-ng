import ahAPI from "../../api/SupertestAHAPIHelper";
import TestData from "../testdata";
const { matchersWithOptions } = require('jest-json-schema');
const schema = require('../schema.json');
expect.extend(matchersWithOptions({schemas: [schema]}));

describe('[jest] Authorize', () => {

    test("Positive login", async () => {
        const response = await ahAPI.authenticateUser({email:TestData.defaultUserDetails.email, password:TestData.defaultUserDetails.pass});
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/login'})
    })

    test.each([
        { payload: {email:TestData.defaultUserDetails.email, password:"blah"}, description: "Invalid password",
            code:401, message:"Invalid email or password"},
        { payload:{ email:TestData.defaultUserDetails.email, password:""}, description: "Empty password" ,
            code:401 , message:"Invalid email or password"},
        { payload: {email:TestData.defaultUserDetails.email}, description: "Empty password",
            code:400, message:"password.*expected string, received undefined"},
        { payload: {email:"blah@blah.blah", password:TestData.defaultUserDetails.pass}, description: "Non-existing email",
            code:401, message:"Invalid email or password"},
        { payload: {email:"", password:TestData.defaultUserDetails.pass}, description: "Empty email",
            code:400, message:"Invalid email"},
        { payload: {password:TestData.defaultUserDetails.pass}, description: "Empty email",
            code:400, message:"email.*expected string, received undefined"},
    ])
    ("Negative login - Wrong password - $description", async ({payload,code,message}) => {
        const response = await ahAPI.authenticateUser(payload);
        expect(response.statusCode).toBe(code);
        expect(response.body.message).toMatch(new RegExp(message))
    })

})
