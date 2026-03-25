import ahAPI from "../api/SupertestAHAPIHelper";
import TestData from "./testdata";
const { matchersWithOptions } = require('jest-json-schema');
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));

describe('[jest] Status', () => {

    test("Make Health status call", async () => {
         let resp= await ahAPI.getHealth();
         expect(resp.statusCode).toBe(200);
         expect(resp.body).toMatchSchema( {$ref: 'schema#/definitions/welcome'})
         expect(resp.body.status).toMatch("healthy")
    })
})