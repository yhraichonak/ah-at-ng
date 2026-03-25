import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import * as allure from "allure-js-commons";
import TestData from "../testdata";
import commonHelper from "../../api/CommonHelper";
import xlsx from "node-xlsx";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testResellerAsset=TestData.TEST_RESELLER_ASSET_MAP[TestData.TEST_DATA_MODE];
describe('[jest] Entity assets', () => {
    let testCustomerId=TestData.defaultEndUserDetails.id;
    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {})

    test("Get Assets", async () => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,testCustomerId, "assets",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/assets'})
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
    ])
    (`Sorting by $attr in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,
            testCustomerId,"assets",TestData.defaultOrgId,`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder:[]= response.body.data.map(t=>t[attr])
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order,false);
        expect(actualOrderString).toEqual(expectedOrderString);
    })
    test.each([
        { attr:"endCustomerPriceFinalSum",order:"asc" },
        { attr:"endCustomerPriceFinalSum",order:"desc" },
        { attr:"resellerPriceFinalSum",order:"asc" },
        { attr:"resellerPriceFinalSum",order:"desc" },
    ])

    (`Sorting by prices $attr in $order order`, async ({attr, order}) => {
        await allure.issue("AH-1070")
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,
            testCustomerId,"assets",TestData.defaultOrgId,`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder:[]= response.body.data.map(t=>t[attr])
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order,false);
        expect(actualOrderString).toEqual(expectedOrderString);
    })

    test("Pagination - Default", async () => {
        let response =await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,testCustomerId, "assets","","","","",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(50);
    })

    test("Pagination - 5 pages", async () => {
        let response =await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,testCustomerId,"assets","5","","","",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(5)
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    })

    test("Pagination - Invalid page size", async () => {
        let response =await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,testCustomerId,"assets","blah","","","",TestData.defaultOrgId);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("limit: Expected number, received nan");
    })

    test("Pagination - Cursor", async () => {
        let entities20 =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,testCustomerId,"assets","20","","","",TestData.defaultOrgId)).body.data;
        let response=await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,testCustomerId,"assets","10","","","",TestData.defaultOrgId);
        let nextCursor=response.body.meta.nextCursor
        let quotesFirst10 =response.body.data;
        let quotesLast10 =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,testCustomerId,"assets","10",nextCursor,"","",TestData.defaultOrgId)).body.data;
        expect(entities20.map(u=>u.serialNumber).join(",")).toContain(quotesFirst10.map(u=>u.serialNumber).join(","));
        expect(entities20.map(u=>u.serialNumber).join(",")).toContain((quotesLast10.map(u=>u.serialNumber)).join(","));
    })

    test.each([
        {  attribute: "name", query: "HP 3PAR 8000 3.84TB SAS cMLC SFF SSD" },
        {  attribute: "serialNumber", query: "044026c654b12715" }
    ])
    ("Search - by $attribute", async ({attribute,query}) => {
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,testCustomerId,"assets","","",query,"",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.length).toBeGreaterThan(0)
        expect(response.body.data.map(u=>u[attribute]).join(",")).toBe(response.body.data.filter(u=>u[attribute].includes(query)).map(u=>u[attribute]).join(","))
    })

    test("Search without results", async () => {
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,testCustomerId,"assets","","","blah","",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data).toHaveLength(0)})

    test("Assets - Filter - Show EOSL", async () => {
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,testCustomerId,"assets","","","","hasEndOfServiceLifeDate=true",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.length).toEqual(response.body.data.filter(t=>t.supportLifeEndDate!=null).length)
    })

    test("Assets - Filter - Show Priced", async () => {
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,testCustomerId,"assets","","","","hasEndCustomerPrice=true",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.length).toBe(response.body.data.filter(u=>u.endCustomerPriceFinalSum>0).length)
    })

    test("Get Assets - Asset Info", async () => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,testCustomerId, "assets",TestData.defaultOrgId,`?search=${testResellerAsset["serialNumber"]}`);
        expect(response.statusCode).toBe(200);
        let target_entity=response.body.data.find(n=>n.serialNumber==testResellerAsset["serialNumber"]);
        expect(target_entity.name.toString()).toEqual(testResellerAsset["name"].toString());
        expect(target_entity.serialNumber).toEqual(testResellerAsset["serialNumber"]);
        expect(target_entity.productSku).toEqual(testResellerAsset["productSku"]);
    })

    test("Non-existing entity", async () => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,TestData.nonExisingId, "assets",TestData.defaultOrgId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(new RegExp(`${TestData.errorMessages['ENTITY_NOT_EXISTS']}`));
    })

    test("Unauthorized", async () => {
        let response =await ahAPI.getEntityItems("blah",testCustomerId, "assets",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })


    test("Get Entity - Assets - Export as CSV", async () => {
        let response = await ahAPI.exportEntityAssets(ahAPI.COMMON_TOKEN, TestData.defaultOrgId, testCustomerId, "csv");
        expect(response.statusCode).toBe(200);
        expect(response.text).toContain(`Name,SerialNumber,ProductSku,ItemsCount,ServiceGroupSku,ServiceGroupLabel,ResellerPriceFinalSum,EndCustomerPriceFinalSum,StartDate,EndDate,SupportLifeEndDate`);
        expect(response.text).toMatch(new RegExp(`.*HP 3PAR StoreServ 8400 2N Fld Int Base,14f49701bdfb3d2a,H6Y96A,1,HU4A6AC,HPE Tech Care Essential SVC,.*520.94,.*548.36,01/01/2023,01/01/2023.*`,"s"));
    },80000)

    test("Get Entity - Assets - Export as XLSX", async () => {
        let response = await ahAPI.exportEntityAssets(ahAPI.COMMON_TOKEN, TestData.defaultOrgId, testCustomerId, "xlsx");
        expect(response.statusCode).toBe(200);
        let xlsx_content=await commonHelper.convertBinaryXlsxToCsv(xlsx.parse(response.body));
        expect(xlsx_content).toContain(`Name,SerialNumber,ProductSku,ItemsCount,ServiceGroupSku,ServiceGroupLabel,ResellerPriceFinalSum,EndCustomerPriceFinalSum,StartDate,EndDate,SupportLifeEndDate`);
        expect(xlsx_content).toMatch(new RegExp(`.*HP 3PAR StoreServ 8400 2N Fld Int Base,14f49701bdfb3d2a,H6Y96A,1,HU4A6AC,HPE Tech Care Essential SVC,.*520.94,.*548.36,01/01/2023,01/01/2023.*`,"s"));
    },80000)

    test("Get Entity - Assets - Export as xlsx - Non-existing quoteId", async () => {
        let response =await ahAPI.exportEntityAssets(ahAPI.COMMON_TOKEN, TestData.defaultOrgId, TestData.nonExisingId, "xlsx");
        expect(response.statusCode).toBe(404);
    })

    test("Get Entity - Assets - Export as csv - Non-existing orgId", async () => {
        let response =await ahAPI.exportEntityAssets(ahAPI.COMMON_TOKEN, TestData.nonExisingId, testCustomerId, "csv");
        expect(response.statusCode).toBe(403);
    })

    test("Get Entity - Assets - Export as CSV - Unauthorized", async () => {
        let response =await ahAPI.exportEntityAssets("BLAH", TestData.nonExisingId, testCustomerId, "csv");
        expect(response.statusCode).toBe(401);
    })

})

