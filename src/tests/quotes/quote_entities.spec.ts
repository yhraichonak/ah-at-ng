import ahAPI from "../../api/SupertestAHAPIHelper";
import commonHelper from "../../api/CommonHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testQuote=TestData.TEST_QUOTE_WITH_CONTRACTS_MAP[TestData.TEST_DATA_MODE];

describe('[jest] Quote entities', () => {

    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {await TestData.initUsersAndRoles()})


    test("Quote - Get Entities", async () => {
        let response =await ahAPI.getQuoteEntities(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testQuote["id"]);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/entities'})
    })
;
    test("Quote - Get Entities - Info", async () => {
        let response =await ahAPI.getQuoteEntities(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, testQuote["id"]);
        expect(response.statusCode).toBe(200);
        let targetObject=response.body.data.find(u=>u.type.startsWith("EndUser"));
        expect(targetObject["id"].toString()).toEqual(TestData.defaultEndUserDetails.id.toString());
        expect(targetObject["name"]).toEqual(TestData.defaultEndUserDetails.name.toString());
        targetObject=response.body.data.find(u=>u.type.startsWith("Vendor"));
        expect(targetObject["name"]).toEqual(TestData.defaultDistributorVendorDetails.name.toString());
        targetObject=response.body.data.find(u=>u.type.startsWith("Distributor"));
        expect(targetObject["name"]).toEqual(TestData.defaultDistributorDetails.name.toString());
        targetObject=response.body.data.find(u=>u.type.startsWith("Reseller"));
        expect(targetObject["name"]).toEqual(TestData.defaultOrganizationEntityDetails.name.toString());
       })


    test("Quote - Get Entities - Unauthorized", async () => {
        let response =await ahAPI.getQuoteEntities("blah",TestData.defaultOrgId, testQuote["id"]);
        expect(response.statusCode).toBe(401);
    })

    test("Quote - Get Entities - wrong orgId", async () => {
        let response =await ahAPI.getQuoteEntities(ahAPI.COMMON_TOKEN,TestData.nonExisingId, testQuote["id"]);
        expect(response.statusCode).toBe(403);
    })

    test("Quote - Get Entities - wrong quoteId", async () => {
        let response =await ahAPI.getQuoteEntities(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.nonExisingId);
        expect(response.statusCode).toBe(404);
    })
})

