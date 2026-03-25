import ahAPI from "../api/SupertestAHAPIHelper";
import { propertiesToJson } from 'properties-file/content'
import TestData from "./testdata";
const { matchersWithOptions } = require('jest-json-schema');
import * as allure from "allure-js-commons";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));

afterEach(async () => {await ahAPI.clearCommonSession();})
beforeAll(async () => {await ahAPI.getCommonSessionForSA()})
beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})

describe('[jest] Metrics', () => {

    test("Metrics", async () => {
        const response = await ahAPI.getMetrics( ahAPI.COMMON_TOKEN, TestData.superOrgId);
        expect(response.statusCode).toBe(200);
        const jsonContent=propertiesToJson(response.text);
        expect(jsonContent).toMatchSchema( {$ref: 'schema#/definitions/metrics'})
    })

    test("Metrics - Unauthorized", async () => {
        const response = await ahAPI.getMetrics("blah",ahAPI.COMMON_SA_TOKEN);
        expect(response.statusCode).toBe(401);
    })

})
