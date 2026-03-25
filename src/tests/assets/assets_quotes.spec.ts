import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import commonHelper from "../../api/CommonHelper";

expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testAsset=TestData.TEST_QUOTE_ASSET_MAP[TestData.TEST_DATA_MODE];
let testAssetQuote=TestData.TEST_QUOTE_MAP[TestData.TEST_DATA_MODE];
describe('[jest] Asset Quotes', () => {

    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})

    test("Asset - Quotes", async () => {
        let response =await ahAPI.getAssetQuotes(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  testAsset["serialNumber"]);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/quotes'})
    })

    test("Asset - Quote Info", async () => {
        let response =await ahAPI.getAssetQuotes(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, testAsset["serialNumber"]);
        expect(response.statusCode).toBe(200);
        let target_entity=response.body.data.find(n=>n.quoteNo==testAssetQuote["quoteNo"]);

        expect(target_entity.quoteNo.toString()).toEqual(testAssetQuote["quoteNo"].toString());
        expect(target_entity.uiStatus.toString()).toEqual(testAssetQuote["status"].toString());
        expect(target_entity.groupId.toString()).toEqual(testAssetQuote["groupId"].toString());
        expect(target_entity.resellerTotalPrice.toString()).toEqual(testAssetQuote["resellerTotalFull"].toString());
        expect(target_entity.endCustomerTotalPrice.toString()).toEqual(testAssetQuote["endCustomerTotalPriceFull"].toString());
        expect(target_entity.startDate.toString()).toEqual(testAssetQuote["startDate"].toString());
        expect(target_entity.endDate.toString()).toEqual(testAssetQuote["endDate"].toString());
    })

    test.each([
        { attribute: "quoteNo", query: testAssetQuote["quoteNo"] },
        { attribute: "groupId", query: testAssetQuote["groupId"]  },
    ])
    ("Get Asset - Quotes - Search - by $attribute", async ({attribute,query}) => {
        let response =(await ahAPI.getAssetQuotesWithParams(ahAPI.COMMON_TOKEN,
                                                            TestData.defaultOrgId,
                                                            testAsset["serialNumber"],
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
        { attr:"resellerTotalPrice",order:"asc" },
        { attr:"resellerTotalPrice",order:"desc" },
        { attr:"endCustomerTotalPrice",order:"asc" },
        { attr:"endCustomerTotalPrice",order:"desc" }
    ])
    (`Get Asset - Quotes - Sorting by $attr in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getAssetQuotes(ahAPI.COMMON_TOKEN,
                                                 TestData.defaultOrgId,
                                                 testAsset["serialNumber"],`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder:[]= response.body.data.map(t=>t[attr]).filter((x) => x !== null);
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order,false);
        expect(actualOrderString).toEqual(expectedOrderString);
    })

    test("Get Asset - Quotes - Filter - Status", async () => {
        let statusString="Open";
        let status= `status[]=${statusString}`;
        let response =(await ahAPI.getAssetQuotesWithParams(ahAPI.COMMON_TOKEN,
                                                            TestData.defaultOrgId,
                                                            testAsset["serialNumber"],
                                                            "", "","",status));
        expect(response.statusCode).toBe(200)
        expect(   response.body.data.map(u=>u.id).join(","))
            .toBe(response.body.data.filter(u=>u.uiStatus.startsWith(statusString)).map(u=>u.id).join(","))
    })

    test("Get Asset - Quotes - Unauthorized", async () => {
        let response =await ahAPI.getAssetQuotes("blah",TestData.defaultOrgId, testAsset['serialNumber']);
        expect(response.statusCode).toBe(401);
    })

    test("Get Asset - Quotes - Invalid orgId", async () => {
        let response =await ahAPI.getAssetQuotes(ahAPI.COMMON_TOKEN, TestData.nonExisingId,testAsset['serialNumber']);
        expect(response.statusCode).toBe(403);
    })

    test("Get Asset - Quotes - Invalid Asset serial", async () => {
        let response =await ahAPI.getAssetQuotes(ahAPI.COMMON_TOKEN, TestData.defaultOrgId,"BLAH");
        expect(response.body.data).toStrictEqual([])
    })
})