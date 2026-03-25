import ahAPI from "../../api/SupertestAHAPIHelper";
import commonHelper from "../../api/CommonHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import xlsx from "node-xlsx";
import * as allure from "allure-js-commons";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testContract=TestData.TEST_CONTRACT_MAP[TestData.TEST_DATA_MODE];
let testContractAsset=TestData.TEST_CONTRACT_ASSET_MAP[TestData.TEST_DATA_MODE];
describe('[jest] Contract Assets', () => {

    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {})


    test("Get Contract - Assets", async () => {
        let response =await ahAPI.getContractAssets(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  testContract['id']);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/assets'})
    })

    test("Get Contract - Assets - Asset Details", async () => {
        let response =await ahAPI.getContractAssets(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  testContract['id']);
        expect(response.statusCode).toBe(200);
        let target_entity=response.body.find(n=>n.name==testContractAsset["name"]);
        expect(target_entity.serviceGroupLabel).toEqual(testContractAsset["serviceGroupLabel"]);
        expect(target_entity.productSku).toEqual(testContractAsset["productSku"]);
        expect(target_entity.serialNumber).toEqual(testContractAsset["serialNumber"]);
    })

    test.each([
        { attr:"name",order:"asc" },
        { attr:"name",order:"desc" },
        { attr:"serialNo",order:"asc" },
        { attr:"serialNo",order:"desc" },
        { attr:"serviceGroupSku",order:"asc" },
        { attr:"serviceGroupSku",order:"desc" },
        { attr:"quantity",order:"asc" },
        { attr:"quantity",order:"desc" },
        { attr:"endCustomerPriceFinalSum",order:"asc" },
        { attr:"endCustomerPriceFinalSum",order:"desc" },
        { attr:"resellerPriceFinalSum",order:"asc" },
        { attr:"resellerPriceFinalSum",order:"desc" },
    ])

    (`Get Contract - Sorting by $attr in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getContractAssets(ahAPI.COMMON_TOKEN,
            TestData.defaultOrgId,testContract.id,`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder:[]= response.body.map(t=>t[attr])
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order);
        expect(actualOrderString).toEqual(expectedOrderString);
    })

    test("Get Contract - Assets - Non-existing contractId", async () => {
        let response =await ahAPI.getContractAssets(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  TestData.nonExisingId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(new RegExp(`${TestData.errorMessages['CONTRACT_NOT_FOUND']}`))
    })

    test("Get Contract - Assets - Unauthorized", async () => {
        let response =await ahAPI.getContractAssets("blah",TestData.defaultOrgId,  testContract['id']);
        expect(response.statusCode).toBe(401);
    })

    test("Get Contract - Assets - Search", async () => {
        let response =await ahAPI.getContractAssetsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testContract.id,"","","TG8D11D","",);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/assets'})
    })

    test("Get Contract - Assets - Pagination - Default", async () => {
        let response =await ahAPI.getContractAssets(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testContract.id);
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBeLessThanOrEqual(50);
    })


    test("Get Contracts - Assets - Pagination - 10 item per pages", async () => {
        let response =await ahAPI.getContractAssetsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testContract.id,"10","","","");
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(10)
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    })

    test("Get Contracts - Assets - Pagination - Invalid page size", async () => {
        let response =await ahAPI.getContractAssetsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testContract.id,"blah","","","");
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("limit: Expected number, received nan");
    })

    test("Get Contracts - Assets - Pagination - Cursor", async () => {
        let entities20 =(await ahAPI.getContractAssetsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testContract.id,"20","","","")).body.data;
        let response=await ahAPI.getContractAssetsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testContract.id,"10","","","");
        let nextCursor=response.body.meta.nextCursor
        let contractsFirst10 =response.body.data;
        let contractsLast10 =(await ahAPI.getContractAssetsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testContract.id,"10",nextCursor,"","")).body.data;
        expect(entities20.map(u=>u.serialNumber).join(",")).toContain(contractsFirst10.map(u=>u.serialNumber).join(","));
        expect(entities20.map(u=>u.serialNumber).join(",")).toContain(contractsLast10.map(u=>u.serialNumber).join(","));
    })

    test("Get Contracts - Assets - Pagination - No next page", async () => {
        let response =(await ahAPI.getContractAssetsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testContract['id'],"100","","",""));
        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBeLessThanOrEqual(100)
        expect(response.body.meta.hasNextPage).toBe(false)
        expect(response.body.meta.nextCursor).toBeNull();
    })

    test("Get Contracts - Assets - Pagination - Non-Existing cursor", async () => {
        let response =(await ahAPI.getContractAssetsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testContract.id,"5","99999","",""));
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(0)
        expect(response.body.meta.hasNextPage).toBe(false)
        expect(response.body.meta.nextCursor).toBeNull();
    })

    test.each([
        {  attribute: "name", query: testContractAsset.name },
        {  attribute: "serialNumber", query: testContractAsset.serialNumber  },
        {  attribute: "productSku", query:  testContractAsset.productSku }
    ])
    ("Get Contracts - Assets - Search - by $attribute", async ({attribute,query}) => {
        let response =(await ahAPI.getContractAssetsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testContract.id,"","",query,""));
        expect(response.statusCode).toBe(200)
        expect(response.body.length).toBeGreaterThan(0)
        expect(response.body.map(u=>u[attribute]).join(",")).toBe(response.body.filter(u=>u[attribute].includes(query)).map(u=>u[attribute]).join(","))
    })

    test("Get Contracts - Assets - Search without results", async () => {
        let response =(await ahAPI.getContractAssetsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testContract.id,"","","blah",""));
        expect(response.statusCode).toBe(200)
        expect(response.body).toHaveLength(0)})

    test("Get Contracts - Assets - Filter - Has End Customer Price", async () => {
        let response =(await ahAPI.getContractAssetsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testContract.id,"","","","hasEndCustomerPrice=true"));
        expect(response.statusCode).toBe(200)
        expect(response.body.length).toBeGreaterThan(0)
        expect(response.body.map(u=>u.serialNumber).join(",")).toBe(response.body.filter(u=>u.endCustomerPriceFinalSum>0).map(u=>u.serialNumber).join(","))
    })

    test("Get Contracts - Assets - Filter - Has End Customer Price - Non-Exising", async () => {
        let response =(await ahAPI.getContractAssetsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testContract.id,"","","","hasEndCustomerPrice=blah"));
        expect(response.statusCode).toBe(200)
        // expect(response.body.message).toMatch("hasEndCustomerPrice: Expected boolean, received string");
    })

    test("Get Contracts - Assets - Filter - Show EOSL", async () => {
        let response =(await ahAPI.getContractAssetsWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testContract.id,"","","","hasEndOfServiceLifeDate=true"));
        expect(response.statusCode).toBe(200)
        expect(response.body.length).toEqual(response.body.filter(t=>t.supportLifeEndDate!=null).length)
    })

    test("Get Contracts - Assets - Export as CSV", async () => {
        let response = await ahAPI.exportContractAssets(ahAPI.COMMON_TOKEN, TestData.defaultOrgId, testContract['id'], "csv");
        expect(response.statusCode).toBe(200);
        expect(response.text).toContain(`Name,SerialNumber,CoverageStatus,ServiceGroupLabel,ServiceGroupSku,ProductSku,Quantity,ReferenceId,ResellerPriceFinalSum,EndCustomerPriceFinalSum,Currency,StartDate,EndDate,SupportLifeEndDate`);
        expect(response.text).toContain(`HP BLc7000 CTO 3 IN LCD ROHS Encl,caad0bbaec2b923e,UNKNOWN,HPE Tech Care Essential SVC,HU4A6AC,507019-B21,1,0058499442,\"1,220.68\",\"1,284.93\",CHF,01/01/2024,06/30/2024,`);
    })

    test("Get Contracts - Assets - Export as XLSX", async () => {
        let response = await ahAPI.exportContractAssets(ahAPI.COMMON_TOKEN, TestData.defaultOrgId, testContract['id'], "xlsx");
        expect(response.statusCode).toBe(200);
        let xlsx_content=await commonHelper.convertBinaryXlsxToCsv(xlsx.parse(response.body));
        expect(xlsx_content).toContain(`Name,SerialNumber,CoverageStatus,ServiceGroupLabel,ServiceGroupSku,ProductSku,Quantity,ReferenceId,ResellerPriceFinalSum,EndCustomerPriceFinalSum,Currency`);
        expect(xlsx_content).toContain(`HP BLc7000 CTO 3 IN LCD ROHS Encl,caad0bbaec2b923e,UNKNOWN,HPE Tech Care Essential SVC,HU4A6AC,507019-B21,1,0058499442,1,220.68,1,284.93,CHF,01/01/2024,06/30/2024`);
    })

    test("Get Contracts - Assets - Export as xlsx - Non-existing quoteId", async () => {
        let response =await ahAPI.exportContractAssets(ahAPI.COMMON_TOKEN, TestData.defaultOrgId, TestData.nonExisingId, "xlsx");
        expect(response.statusCode).toBe(404);
    })

    test("Get Contracts - Assets - Export as csv - Non-existing orgId", async () => {
        let response =await ahAPI.exportContractAssets(ahAPI.COMMON_TOKEN, TestData.nonExisingId, testContract['id'], "csv");
        expect(response.statusCode).toBe(403);
    })

    test("Get Contracts - Assets - Export as CSV - Unauthorized", async () => {
        let response =await ahAPI.exportContractAssets("BLAH", TestData.nonExisingId, testContract['id'], "csv");
        expect(response.statusCode).toBe(401);
    })
})

