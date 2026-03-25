import ahAPI from "../../api/SupertestAHAPIHelper";
import commonHelper from "../../api/CommonHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import {expect} from "@playwright/test";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let entityId=TestData.defaultOrgId
let testContract=TestData.TEST_CONTRACT_MAP[TestData.TEST_DATA_MODE];
let testQuote=TestData.TEST_QUOTE_MAP[TestData.TEST_DATA_MODE];
describe('[jest] Contract Quotes', () => {

    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})

    test("Get Contract - Quotes", async () => {
        let response =await ahAPI.getContractQuotes(ahAPI.COMMON_TOKEN,entityId, testContract["id"]);
        expect(response.statusCode).toBe(200);
        let target_entity=response.body.data.find(n=>n.quoteNo==testQuote["quoteNo"]);
        expect(target_entity.id.toString()).toEqual(testQuote["id"].toString());
        expect(target_entity.quoteNo.toString()).toEqual(testQuote["quoteNo"].toString());
        expect(target_entity.uiStatus.toString()).toEqual(testQuote["status"].toString());
        expect(target_entity.groupId.toString()).toEqual(testQuote["groupId"].toString());
        expect(target_entity.currency.toString()).toEqual(testQuote["currency"].toString());
    })


    test.each([
        { attribute: "quoteNo", query: testQuote["quoteNo"] },
        { attribute: "groupId", query: testQuote["groupId"]  },
    ])
    ("Get Contract - Quotes - Search - by $attribute", async ({attribute,query}) => {
        let response =(await ahAPI.getContractQuotesWithParams(ahAPI.COMMON_TOKEN,
                                                                entityId,
                                                                testContract['id'],
                                                                "", "",query,""));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.length).toBeGreaterThan(0)
        expect(response.body.data.map(u=>u[attribute]).join(","))
            .toBe(response.body.data.filter(u=>u[attribute].includes(query)).map(u=>u[attribute]).join(","))
    })

    test.each([
        { attr:"quoteNo",order:"asc" },
        { attr:"quoteNo",order:"desc" },
        { attr:"uiStatus",order:"asc" },
        { attr:"uiStatus",order:"desc" },
        { attr:"startDate",order:"asc" },
        { attr:"startDate",order:"desc" },
        { attr:"groupId",order:"asc" },
        { attr:"groupId",order:"desc" },
        { attr:"endUser",order:"asc" },
        { attr:"endUser",order:"desc" },
        { attr:"resellerTotalPrice",order:"asc" },
        { attr:"resellerTotalPrice",order:"desc" },
        { attr:"endCustomerTotalPrice",order:"asc" },
        { attr:"endCustomerTotalPrice",order:"desc" }
    ])
    (`Get Contract - Quotes - Sorting by $attr in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getContractQuotes(ahAPI.COMMON_TOKEN,
                                                    TestData.defaultOrgId,
                                                    testContract['id'],`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder:[]= response.body.data.map(t=>( t[attr]?.name!==undefined)?t[attr].name:t[attr]);
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order);
        expect(actualOrderString).toEqual(expectedOrderString);
    })

    test("Get Contract - Quotes - Filter - Status", async () => {
        let statusString="Lost";
        let status= `status[]=${statusString}`;
        let response =(await ahAPI.getContractQuotesWithParams(ahAPI.COMMON_TOKEN,
                                                                entityId,
                                                                testContract['id'],
                                                                "","","",status));
        expect(response.statusCode).toBe(200)
        expect(   response.body.data.map(u=>u.id).join(","))
            .toBe(response.body.data.filter(u=>u.uiStatus.startsWith(statusString)).map(u=>u.id).join(","))
    })

    test("Get Contract - Quotes - Empty list", async () => {
        let response =await ahAPI.getContractQuotes(ahAPI.COMMON_TOKEN,entityId,  TestData.contractWithoutQuotes);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(0);
    })

    test("Get Contract - Quotes - Non-existing contract", async () => {
        let response =await ahAPI.getContractQuotes(ahAPI.COMMON_TOKEN,entityId,  TestData.nonExisingId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(new RegExp(`${TestData.errorMessages['CONTRACT_NOT_FOUND']}`));
    })

    test("Get Contract - Quotes - Unauthorized", async () => {
        let response =await ahAPI.getContractQuotes("blah",entityId,  TestData.defaultQWCContractId);
        expect(response.statusCode).toBe(401);
    })

})