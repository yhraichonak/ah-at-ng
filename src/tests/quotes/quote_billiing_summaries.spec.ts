import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testQuote=TestData.TEST_QUOTE_WITH_CONTRACTS_MAP[TestData.TEST_DATA_MODE];
let testContact=TestData.TEST_QUOTE_CONTACT_MAP[TestData.TEST_DATA_MODE]

describe('[jest] Quote billing summaries', () => {

    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {await TestData.initUsersAndRoles()})


    test("Quote - Get Billing Summary ", async () => {
        let response =await ahAPI.getQuoteBillingSummary(ahAPI.COMMON_TOKEN,TestData.billingSummaryOrgId,TestData.quoteWithBillingSummary);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/billing_summary'})
    })

    test("Quote - Get Billing Summary - Info ", async () => {
        let response =await ahAPI.getQuoteBillingSummary(ahAPI.COMMON_TOKEN,TestData.billingSummaryOrgId,TestData.quoteWithBillingSummary);
        expect(response.statusCode).toBe(200);
        expect(JSON.stringify(response.body)).toMatchSchema( /GEOB001/)
    })



    test("Quote - Get Billing Summary - No Summary ", async () => {
        let response =await ahAPI.getQuoteBillingSummary(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, testQuote['id']);
        expect(response.statusCode).toBe(404);
    })

    test("Quote - Get Billing Summary - Unauthorized", async () => {
        let response =await ahAPI.getQuoteBillingSummary("BLAH",TestData.billingSummaryOrgId,TestData.quoteWithBillingSummary);
        expect(response.statusCode).toBe(401);
    })

    test("Quote - Get Billing Summary - Unprivileged", async () => {
        let TOKEN=await ahAPI.getUserToken(TestData.restrictedUserDetails)
        let response =await ahAPI.getQuoteBillingSummary(TOKEN,TestData.billingSummaryOrgId,TestData.quoteWithBillingSummary);
        expect(response.statusCode).toBe(403);
    })

    test("Quote - Get Billing Summary - non-Existing orgId", async () => {
        let response =await ahAPI.getQuoteBillingSummary(ahAPI.COMMON_TOKEN,TestData.nonExisingId,TestData.quoteWithBillingSummary);
        expect(response.statusCode).toBe(403);
    })

    test("Quote - Get Billing Summary - non-Existing quote", async () => {
        let response =await ahAPI.getQuoteBillingSummary(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,TestData.nonExisingId);
        expect(response.statusCode).toBe(404);
    })

})

