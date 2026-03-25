import ahAPI from "../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "./testdata";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testQuote=TestData.TEST_QUOTE_MAP[TestData.TEST_DATA_MODE];
let testContract=TestData.TEST_CONTRACT_MAP[TestData.TEST_DATA_MODE]
let testResellerAsset=TestData.TEST_RESELLER_ASSET_MAP[TestData.TEST_DATA_MODE];
describe('[jest] Global Search', () => {

    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
    })

    test("Global Search  - schema", async () => {
        let response =(await ahAPI.globalSearch(ahAPI.COMMON_TOKEN,"108",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/global_search_results'})
    },10000)

    test("Global Search - Quote Info", async () => {
        let response =await ahAPI.globalSearch(ahAPI.COMMON_TOKEN,testQuote["quoteNo"],TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.quotes[0].id).toEqual(testQuote["id"].toString());
        expect(response.body.quotes[0].quoteNo).toEqual(testQuote["quoteNo"]);
        expect(response.body.quotes[0].uiStatus).toEqual((typeof testQuote["status"] === "number")?
            TestData.STATUSES[testQuote["status"]]:testQuote["status"]);
        expect(response.body.quotes[0].groupId).toEqual(testQuote["groupId"]);
    })

    test("Global Search - Contract Info", async () => {
        let response =await ahAPI.globalSearch(ahAPI.COMMON_TOKEN,testContract["contractNumber"],TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.contracts[0].id).toEqual(testContract["id"].toString());
        expect(response.body.contracts[0].contractNo).toEqual(testContract["contractNumber"]);
        expect(response.body.contracts[0].uiStatus).toEqual((typeof testContract["status"] === "number")?
            TestData.STATUSES[testContract["status"]]:testContract["status"]);
        expect(response.body.contracts[0].groupId).toEqual(testContract["groupId"]);
        expect(response.body.contracts[0].startDate).toEqual(testContract["startDateOnly"]);
        expect(response.body.contracts[0].endDate).toEqual(testContract["endDateOnly"]);
        expect(response.body.contracts[0].sar).toEqual(testContract["sar"]);
    })


    test("Global Search - Asset Info", async () => {
        let response =await ahAPI.globalSearch(ahAPI.COMMON_TOKEN,testResellerAsset["serialNumber"],TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.assets[0].serialNumber).toEqual(testResellerAsset["serialNumber"]);
        expect(response.body.assets[0].productSku).toEqual(testResellerAsset["productSku"]);
    })

    test("Global Search - Customer Info", async () => {
        let response =await ahAPI.globalSearch(ahAPI.COMMON_TOKEN,TestData.searchCustomerName,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.customers[0].name).toEqual(TestData.searchCustomerName);
    })

    test("Global Search - Customers - Multiple matches", async () => {
        let query="cus"
        let response =await ahAPI.globalSearch(ahAPI.COMMON_TOKEN,query,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        response.body.customers.map(t=>t.name).toString()
        expect( response.body.customers.map(t=>t.name.toLowerCase()).toString())
            .toEqual( response.body.customers.filter((t)=>t.name.toLowerCase().includes(query)).map(t=>t.name.toLowerCase()).toString());
    })

    test("Global Search - Customers - Multiple matches of different type", async () => {
        let serialNumber=TestData.TEST_QUOTE_ASSET_MAP["dump"].serialNumber
        let response =await ahAPI.globalSearch(ahAPI.COMMON_TOKEN,serialNumber,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.assets[0].serialNumber).toEqual(serialNumber);
        expect(response.body.quotes.filter(t=>t['quoteNo']==TestData.TEST_QUOTE_MAP["dump"].quoteNo).length).toBe(1);
    })

    test("Global Search - Customers - Too short input", async () => {
        let query="cu"
        let response =await ahAPI.globalSearch(ahAPI.COMMON_TOKEN,query,TestData.defaultOrgId);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(/String must contain at least 3 character/)
    })

    test("Global Search - Service Pack Info", async () => {
        let response =await ahAPI.globalSearch(ahAPI.COMMON_TOKEN,TestData.altServicePack.name,TestData.altOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.servicePacks[0].packNo).toEqual(TestData.altServicePack.name);
    })

    test("Global Search - No results", async () => {
        let response =await ahAPI.globalSearch(ahAPI.COMMON_TOKEN,"blah",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.quotes).toHaveLength(0);
    })
    test("Global Search - Unauthorized", async () => {
        let response =await ahAPI.globalSearch("BLAH","CH2",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })
    test("Global Search - Invalid orgId", async () => {
        let response =await ahAPI.globalSearch(ahAPI.COMMON_TOKEN,"CH2","blah");
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(/Format der Organisations‑ID/)
    })

})

