import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testAsset=TestData.TEST_CONTRACT_ASSET_MAP[TestData.TEST_DATA_MODE];
describe('[jest] Assets', () => {

    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})


    test("Asset - Get Asset", async () => {
        let response =await ahAPI.getAsset(ahAPI.COMMON_TOKEN, testAsset['serialNumber'],TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/asset_details'})
    })

    test("Asset - Get Asset Details", async () => {
        let response =await ahAPI.getAsset(ahAPI.COMMON_TOKEN, testAsset['serialNumber'],TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.name).toEqual(testAsset["name"]);
        expect(response.body.productSku).toEqual(testAsset["productSku"]);
        expect(response.body.serviceGroupLabel).toEqual(testAsset["serviceGroupLabel"]);
        expect(response.body.coverageStatus).toEqual(testAsset["coverageStatus"]);
        expect(response.body.serialNo).toEqual(testAsset["serialNumber"]);
        expect(response.body.startDate).toEqual(testAsset["startDate"]);
        expect(response.body.endDate).toEqual(testAsset["endDate"]);

    })

    test("Asset - Get Asset - Unauthorized", async () => {
        let response =await ahAPI.getAsset("blah",  testAsset['serialNumber'], TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Asset - Get Asset - Invalid orgId", async () => {
        let response =await ahAPI.getAsset(ahAPI.COMMON_TOKEN,  testAsset['serialNumber'],TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    })

    test("Asset - Get Asset - Invalid Asset serial", async () => {
        let response =await ahAPI.getAsset(ahAPI.COMMON_TOKEN,TestData.nonExisingId,TestData.defaultOrgId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(/Asset.*nicht gefunden/);
    })

    test("Asset - Get Asset - Get Warranty History", async () => {
        let response =await ahAPI.getWarrantyHistory(
            ahAPI.COMMON_TOKEN,TestData.assetWithWarrantySN, TestData.assetWithWarrantyProductSKU,TestData.assetWarrantyOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body[0].data).toMatchSchema( {$ref: 'schema#/definitions/asset_warranty'});
    })

    test("Asset - Get Asset - Get Warranty History - Info", async () => {
        let response =await ahAPI.getWarrantyHistory(
            ahAPI.COMMON_TOKEN,TestData.assetWithWarrantySN, TestData.assetWithWarrantyProductSKU,TestData.assetWarrantyOrgId);
        expect(response.statusCode).toBe(200);
        expect(JSON.stringify(response.body)).toMatch( /.*HPE Tech Care Essential SVC.*HU4A6AC.*/);
    })

    test("Asset - Get Asset - Get Warranty History - Unauthorized", async () => {
        let response =await ahAPI.getWarrantyHistory("BLAH",TestData.assetWithWarrantySN, TestData.assetWithWarrantyProductSKU,TestData.assetWarrantyOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Asset - Get Asset - Get Warranty History - Unprivileged", async () => {
        let TOKEN=await ahAPI.getUserToken(TestData.restrictedUserDetails);
        let response =await ahAPI.getWarrantyHistory(TOKEN,TestData.assetWithWarrantySN, TestData.assetWithWarrantyProductSKU,TestData.assetWarrantyOrgId);
        expect(response.statusCode).toBe(403);
    })

    test("Asset - Get Asset - Get Warranty History - invalid orgId", async () => {
        let response =await ahAPI.getWarrantyHistory( ahAPI.COMMON_TOKEN,TestData.assetWithWarrantySN, TestData.assetWithWarrantyProductSKU,TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    })

    test("Asset - Get Asset - Get Warranty History - invalid serial number", async () => {
        let response =await ahAPI.getWarrantyHistory( ahAPI.COMMON_TOKEN,TestData.assetWithWarrantySN, "BLAH",TestData.assetWarrantyOrgId);
        expect(response.statusCode).toBe(404);
    })

    test("Asset - Get Asset - Get Warranty History - invalid product SKU", async () => {
        let response =await ahAPI.getWarrantyHistory( ahAPI.COMMON_TOKEN,"BLAH", TestData.assetWithWarrantyProductSKU,TestData.assetWarrantyOrgId);
        expect(response.statusCode).toBe(404);
    })

})

