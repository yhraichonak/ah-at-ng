import ahAPI from "../../api/SupertestAHAPIHelper";
import commonHelper from "../../api/CommonHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testQuote=TestData.TEST_QUOTE_WITH_CONTRACTS_MAP[TestData.TEST_DATA_MODE];
let testContact=TestData.TEST_QUOTE_CONTACT_MAP[TestData.TEST_DATA_MODE]

describe('[jest] Quote contacts', () => {

    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {await TestData.initUsersAndRoles()})


    test("Quote - Get Contacts", async () => {
        let response =await ahAPI.getQuoteContacts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testQuote["id"]);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/contacts'})
    })

    test("Quote - Get Contacts - Info", async () => {
        let response =await ahAPI.getQuoteContacts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, testQuote["id"]);
        expect(response.statusCode).toBe(200);
        let targetContact=response.body.find(u=>u.emailAddress.startsWith(testContact["emailAddress"]));
        expect(targetContact["entityId"].toString()).toEqual(testContact["entityId"].toString());
        expect(targetContact["status"]).toEqual(testContact["status"].toString());
        expect(targetContact["contactId"].toString()).toEqual(testContact["contactId"].toString());
        expect(targetContact["surname"]).toEqual(testContact["surname"].toString());
        expect(targetContact["givenName"]).toEqual(testContact["givenName"].toString());
        expect(targetContact["emailAddress"]).toEqual(testContact["emailAddress"].toString());
        expect(targetContact["businessPhone"]).toEqual(testContact["businessPhone"].toString());
        expect(targetContact["active"].toString()).toEqual(testContact["active"].toString());
    })



    test("Quote - Get Contacts - Unauthorized", async () => {
        let response =await ahAPI.getQuoteContacts("blah",TestData.defaultOrgId, testQuote["id"]);
        expect(response.statusCode).toBe(401);
    })

    test("Quote - Get Contacts - wrong orgId", async () => {
        let response =await ahAPI.getQuoteContacts(ahAPI.COMMON_TOKEN,TestData.nonExisingId, testQuote["id"]);
        expect(response.statusCode).toBe(403);
    })

    test("Quote - Get Contacts - wrong quoteId", async () => {
        let response =await ahAPI.getQuoteContacts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.nonExisingId);
        expect(response.statusCode).toBe(404);
    })
})

