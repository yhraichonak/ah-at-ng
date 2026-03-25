import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import commonHelper from "../../api/CommonHelper";
import * as allure from "allure-js-commons";
import {test} from "@jest/globals";

expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testAsset=TestData.TEST_CONTRACT_ASSET_MAP[TestData.TEST_DATA_MODE];
let testAssetContract=TestData.TEST_CONTRACT_MAP[TestData.TEST_DATA_MODE];
describe('[jest] Asset Contract', () => {


    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})

    test("Asset - Contracts", async () => {
        let response =await ahAPI.getAssetContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  testAsset["serialNumber"]);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/contracts'})
    })

    test("Asset - Contract Info", async () => {
        let response =await ahAPI.getAssetContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, testAsset["serialNumber"]);
        expect(response.statusCode).toBe(200);
        let target_entity=response.body.data.find(n=>n.contractNumber==testAssetContract["contractNumber"]);
        expect(target_entity.contractNumber.toString()).toEqual(testAssetContract["contractNumber"].toString());
        expect(target_entity.sar.toString()).toEqual(testAssetContract["sar"].toString());
        expect(target_entity.uiStatus.toString()).toEqual(testAssetContract["status"].toString());
        expect(target_entity.groupId.toString()).toEqual(testAssetContract["groupId"].toString());
        expect(target_entity.resellerTotalPrice.toString()).toEqual(testAssetContract["resellerTotalPriceFull"].toString());
        expect(target_entity.endCustomerTotalPrice).toEqual(testAssetContract["endCustomerTotalPrice"]);
        expect(target_entity.endDate.toString()).toEqual(testAssetContract["endDate"].toString());
    },10000)

    test.each([
        { attribute: "contractNumber", query: testAssetContract.contractNumber },
        { attribute: "groupId", query: testAssetContract.groupId },
        { attribute: "sar", query: testAssetContract.sar }
    ])
    ("Asset - Contracts - Search - by $attribute", async ({attribute,query}) => {
        let response =(await ahAPI.getAssetContractsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testAsset["serialNumber"],"","",query,""));
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
        { attr:"isQuoted",order:"asc" },
        { attr:"isQuoted",order:"desc" },
    ])
    (`Asset - Contracts - Sorting by $attr in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getAssetContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testAsset["serialNumber"],`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder:[]= response.body.data.map(t=>t[attr])
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order);
        expect(actualOrderString).toEqual(expectedOrderString);
    })

    test("Asset - Contracts - Filter - Status", async () => {
        let statusString="Renewed";
        let status= "status[]=Renewed";
        let response =(await ahAPI.getAssetContractsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testAsset['serialNumber'],"","","",status));
        expect(response.statusCode).toBe(200)
        expect(   response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u.status.startsWith(statusString)).map(u=>u.id).join(","))
    })

    test("Get Contracts - Filter - Quoted", async () => {
        let response =await ahAPI.getAssetContractsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testAsset['serialNumber'],"","","",`isQuoted=true`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.length).toBe(response.body.data.filter(u=>u.isQuoted).length)
    })
    test("Asset - Get Contracts - Unauthorized", async () => {
        let response =await ahAPI.getAssetContracts("blah",TestData.defaultOrgId, testAsset['serialNumber']);
        expect(response.statusCode).toBe(401);
    })

    test("Asset - Get Contracts - Invalid orgId", async () => {
        let response =await ahAPI.getAssetContracts(ahAPI.COMMON_TOKEN, TestData.nonExisingId,testAsset['serialNumber']);
        expect(response.statusCode).toBe(403);
    })

    test("Asset - Get Contracts - Invalid Asset serial", async () => {
        let response =await ahAPI.getAssetContracts(ahAPI.COMMON_TOKEN, TestData.defaultOrgId,"BLAH");
        expect(response.body.data).toStrictEqual([])
    })
})