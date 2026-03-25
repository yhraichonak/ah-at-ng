import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testContract=TestData.TEST_CONTRACT_MAP[TestData.TEST_DATA_MODE];
let testContact=TestData.TEST_QUOTE_CONTACT_MAP[TestData.TEST_DATA_MODE]
describe('[jest] Contract contacts', () => {

    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {})


    test("Contract - Get Contacts", async () => {
        let response =await ahAPI.getContractContacts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testContract["id"]);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/contacts'})
    })

    test("Contract - Get Contacts - Info", async () => {
        let response =await ahAPI.getContractContacts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, testContract["id"]);
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

    test("Contract - Get Contacts - Unauthorized", async () => {
        let response =await ahAPI.getContractContacts("blah",TestData.defaultOrgId, testContract["id"]);
        expect(response.statusCode).toBe(401);
    })

    test("Contract - Get Contacts - wrong orgId", async () => {
        let response =await ahAPI.getContractContacts(ahAPI.COMMON_TOKEN,TestData.nonExisingId, testContract["id"]);
        expect(response.statusCode).toBe(403);
    })

    test("Contract - Get Contacts - wrong quoteId", async () => {
        let response =await ahAPI.getContractContacts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.nonExisingId);
        expect(response.statusCode).toBe(404);
    })

})

