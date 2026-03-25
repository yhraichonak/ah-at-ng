import ahAPI from "../../api/SupertestAHAPIHelper";
import commonHelper from "../../api/CommonHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testQuote=TestData.TEST_QUOTE_WITH_CONTRACTS_MAP[TestData.TEST_DATA_MODE];
let testQuoteContract=TestData.TEST_QUOTE_CONTRACT_MAP[TestData.TEST_DATA_MODE];
describe('[jest] Quote contracts', () => {

    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {  await TestData.initUsersAndRoles()})

    test("Get Quote - Contracts", async () => {
        let response =await ahAPI.getQuoteContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,   testQuote['id']);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/contracts'})
    })

    test("Get Quote - Contracts - Contracts Details", async () => {
        let response =await ahAPI.getQuoteContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  testQuote['id']);
        expect(response.statusCode).toBe(200);
        let target_entity=response.body.data.find(n=>n.id==testQuoteContract["id"]);
        expect(target_entity.id).toEqual(testQuoteContract["id"].toString());
        expect(target_entity.contractNumber).toEqual(testQuoteContract["contractNumber"]);
        expect(target_entity.status).toEqual((typeof testQuoteContract["status"] === "number")?
            TestData.STATUSES[testQuoteContract["status"]]:testQuoteContract["status"]);
        expect(target_entity.groupId).toEqual(testQuoteContract["groupId"]);
        expect(target_entity.startDate).toEqual(testQuoteContract["startDate"]);
        expect(target_entity.endDate).toEqual(testQuoteContract["endDate"]);
        expect(target_entity.sar).toEqual(testQuoteContract["sar"]);
    })


    test("Get Quote - Contracts - Pagination", async () => {
        let items10 =(await ahAPI.getQuotesContractsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testQuote['id'],"10","","","",)).body.data;
        let response =(await ahAPI.getQuotesContractsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testQuote['id'],"5","","","",));
        let nextCursor=response.body.meta.nextCursor
        let first5 =response.body.data;
        let last5 =(await ahAPI.getQuotesContractsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testQuote['id'],"5",nextCursor,"","")).body.data;
        expect(items10.map(u=>u.id).join(",")).toContain(first5.map(u=>u.id).join(","));
        expect(items10.map(u=>u.id).join(",")).toContain((last5.map(u=>u.id)).join(","));
    })


    test.each([
        { attribute: "contractNumber", query: testQuoteContract.contractNumber },
        { attribute: "groupId", query: testQuoteContract.groupId },
        { attribute: "sar", query: testQuoteContract.sar }
    ])
    ("Get Quote - Contracts - Search - by $attribute", async ({attribute,query}) => {
        let response =(await ahAPI.getQuotesContractsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testQuote['id'],"","",query,""));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.length).toBeGreaterThan(0)
        expect(response.body.data.map(u=>u[attribute]).join(",")).toBe(response.body.data.filter(u=>u[attribute].includes(query)).map(u=>u[attribute]).join(","))
    })


    test.each([
        { attr:"contractNumber",order:"asc" },
        { attr:"contractNumber",order:"desc" },
        { attr:"sar",order:"asc" },
        { attr:"sar",order:"desc" },
        { attr:"uiStatus",order:"asc" },
        { attr:"uiStatus",order:"desc" },
        { attr:"groupId",order:"asc" },
        { attr:"groupId",order:"desc" },
        { attr:"startDate",order:"asc" },
        { attr:"startDate",order:"desc" },
        { attr:"endDate",order:"asc" },
        { attr:"endDate",order:"desc" },
        { attr:"resellerTotalPrice",order:"asc" },
        { attr:"resellerTotalPrice",order:"desc" },
        { attr:"endUser",order:"asc" },
        { attr:"endUser",order:"desc" }
    ])
    (`Get Quote - Contracts - Sorting by $attr in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getQuoteContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testQuote['id'],`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder:[]= response.body.data.map(t=>( t[attr]?.name!==undefined)?t[attr].name:t[attr]);
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order);
        expect(actualOrderString).toEqual(expectedOrderString);
    })


    test("Get Quote - Contracts - Filter - Status", async () => {
        let statusString="Renewed";
        let status= "status[]=Renewed";
        let response =(await ahAPI.getQuotesContractsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testQuote['id'],"","","",status));
        expect(response.statusCode).toBe(200)
        expect(   response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u.status.startsWith(statusString)).map(u=>u.id).join(","))
    })

    test("Get Quote - Contracts - non-existing quote", async () => {
        let response =await ahAPI.getQuoteContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, "blah");
        expect(response.statusCode).toBe(404);
    })

    test("Get Quote - Contracts - non-existing entity", async () => {
        let response =await ahAPI.getQuoteContracts(ahAPI.COMMON_TOKEN,TestData.nonExisingId, testQuote['id']);
        expect(response.statusCode).toBe(403);
    })

    test("Get Quote - Contracts - unauthorized", async () => {
        let response =await ahAPI.getQuoteContracts("blah",TestData.defaultOrgId, testQuote['id']);
        expect(response.statusCode).toBe(401);
    })


})

