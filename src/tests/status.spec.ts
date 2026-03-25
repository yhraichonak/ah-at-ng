import ahAPI from "../api/SupertestAHAPIHelper";
import TestData from "./testdata";
import keycloakHelper from "../api/KeycloakHelper";
import * as allure from "allure-js-commons";
const { matchersWithOptions } = require('jest-json-schema');
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));

describe('[jest] Status', () => {

    test("Make BS status call", async () => {
         let resp= await ahAPI.getStatus();
         expect(resp.statusCode).toBe(200);
         expect(resp.body).toMatchSchema( {$ref: 'schema#/definitions/welcome'})
    })
})
