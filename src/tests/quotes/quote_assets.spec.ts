import ahAPI from "../../api/SupertestAHAPIHelper";
import commonHelper from "../../api/CommonHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
const fs = require('fs');
import xlsx from 'node-xlsx';
let testQuote=TestData.TEST_QUOTE_MAP[TestData.TEST_DATA_MODE];
let testQuoteAsset=TestData.TEST_QUOTE_ASSET_MAP[TestData.TEST_DATA_MODE];
let testOrgId=TestData.defaultOrgId
describe('[jest] Quote assets', () => {

    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {
        await TestData.initUsersAndRoles()
    })

    test("Get Quote - Assets", async () => {
        let response =await ahAPI.getQuoteAssets(ahAPI.COMMON_TOKEN,testOrgId,  testQuote['id']);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/assets'})
    })

    test("Get Quote - Assets - Asset Details", async () => {
        let response =await ahAPI.getQuoteAssets(ahAPI.COMMON_TOKEN,testOrgId,  testQuote['id'],"?search="+testQuoteAsset["serialNumber"]);
        expect(response.statusCode).toBe(200);
        let target_entity=response.body.find(n=>n.serialNumber==testQuoteAsset["serialNumber"]);
        expect(target_entity.serialNumber.toString()).toEqual(testQuoteAsset["serialNumber"].toString());
        expect(target_entity.serialNumber).toEqual(testQuoteAsset["serialNumber"]);
        expect(target_entity.serviceGroupLabel).toEqual(testQuoteAsset["serviceGroupLabel"]);
        expect(target_entity.productSku).toEqual(testQuoteAsset["productSku"]);
        expect(target_entity.serviceGroupSku).toEqual(testQuoteAsset["serviceGroupSku"]);
    })

    test("Get Quote - Assets - Non-existing quoteId", async () => {
        let response =await ahAPI.getQuoteAssets(ahAPI.COMMON_TOKEN,testOrgId,  TestData.nonExisingId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(new RegExp(`${TestData.errorMessages['QUOTE_NOT_EXISTS']}`));
    })

    test("Get Quote - Assets - Unauthorized", async () => {
        let response =await ahAPI.getQuoteAssets("blah",testOrgId,  testQuote['id']);
        expect(response.statusCode).toBe(401);
    })

    test("Get Quote - Assets - Search", async () => {
        let response =await ahAPI.getQuotesAssetsWithParams(ahAPI.COMMON_TOKEN,testOrgId,testQuote['id'],"","","QA7VX","",);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/assets'})
    })


    test("Get Quotes - Assets - Pagination - Default", async () => {
        let response =await ahAPI.getQuoteAssets(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testQuote['id']);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(50);
    })

    test("Get Quotes - Assets - Pagination - $pages pages", async () => {
        let response =await ahAPI.getQuotesAssetsWithParams(ahAPI.COMMON_TOKEN,testOrgId,testQuote['id'],"1","","","");
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(1)
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    })


    test("Get Quotes - Assets - Pagination - Invalid page size", async () => {
        let response =await ahAPI.getQuotesAssetsWithParams(ahAPI.COMMON_TOKEN,testOrgId,testQuote['id'],"blah","","","");
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("limit: Expected number, received nan");
    })

    test("Get Quotes - Assets - Pagination - Cursor", async () => {
        let entities20 =(await ahAPI.getQuotesAssetsWithParams(ahAPI.COMMON_TOKEN,testOrgId,testQuote['id'],"20","","","")).body.data;
        let response=await ahAPI.getQuotesAssetsWithParams(ahAPI.COMMON_TOKEN,testOrgId,testQuote['id'],"10","","","");
        let nextCursor=response.body.meta.nextCursor
        let quotesFirst10 =response.body.data;
        let quotesLast10 =(await ahAPI.getQuotesAssetsWithParams(ahAPI.COMMON_TOKEN,testOrgId,testQuote['id'],"10",nextCursor,"","")).body.data;
        expect(entities20.map(u=>u.serialNumber).join(",")).toContain(quotesFirst10.map(u=>u.serialNumber).join(","));
        expect(entities20.map(u=>u.serialNumber).join(",")).toContain((quotesLast10.map(u=>u.serialNumber)).join(","));
    })

    test("Get Quotes - Assets - Pagination - No next page", async () => {
        let response =(await ahAPI.getQuotesAssetsWithParams(ahAPI.COMMON_TOKEN,testOrgId,TestData.quoteWithoutAssetsPagination,"2","","",""));
        expect(response.statusCode).toBe(200);
        expect(response.body.meta.hasNextPage).toBe(false)
        expect(response.body.meta.nextCursor).toBeNull();
    })

    test("Get Quote - Assets - Pagination - Non-Existing cursor", async () => {
        let response =(await ahAPI.getQuotesAssetsWithParams(ahAPI.COMMON_TOKEN,testOrgId,testQuote['id'],"5","99999","",""));
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(0)
        expect(response.body.meta.hasNextPage).toBe(false)
        expect(response.body.meta.nextCursor).toBeNull();
    })

    test.each([
        {  attribute: "name", query: "HPE SN6000B 16Gb 48/24 FC Switch" },
        {  attribute: "serialNumber", query: "314cff25fa5c3a4f" },
        {  attribute: "productSku", query: "QK753B" }
    ])
    ("Get Quote - Assets - Search - by $attribute", async ({attribute,query}) => {
        let response =(await ahAPI.getQuotesAssetsWithParams(ahAPI.COMMON_TOKEN,testOrgId,testQuote['id'],"","",query,""));
        expect(response.statusCode).toBe(200)
        expect(response.body.length).toBeGreaterThan(0)
        expect(response.body.map(u=>u[attribute]).join(",")).toBe(response.body.filter(u=>u[attribute].includes(query)).map(u=>u[attribute]).join(","))
    })

    test.each([
        { attr:"name",order:"asc" },
        { attr:"name",order:"desc" },
        { attr:"serialNumber",order:"asc" },
        { attr:"serialNumber",order:"desc" },
        { attr:"serviceGroupSku",order:"asc" },
        { attr:"serviceGroupSku",order:"desc" },
        { attr:"quantity",order:"asc" },
        { attr:"quantity",order:"desc" },
        { attr:"resellerPriceFinalSum",order:"asc" },
        { attr:"resellerPriceFinalSum",order:"desc" },
        { attr:"endCustomerPriceFinalSum",order:"asc" },
        { attr:"endCustomerPriceFinalSum",order:"desc" }
    ])
    (`Get Quote - Assets - Sorting by $attr in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getQuoteAssets(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,testQuote['id'],`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder:[]= response.body.map(t=>t[attr])
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order,false);
        expect(actualOrderString).toEqual(expectedOrderString);
    })

    test("Get Quotes - Assets - Search without results", async () => {
        let response =(await ahAPI.getQuotesAssetsWithParams(ahAPI.COMMON_TOKEN,testOrgId,testQuote['id'],"","","blah",""));
        expect(response.statusCode).toBe(200)
        expect(response.body).toHaveLength(0)})

    test("Get Quotes - Assets - Filter - Has End Customer Price", async () => {
        let response =(await ahAPI.getQuotesAssetsWithParams(ahAPI.COMMON_TOKEN,testOrgId,testQuote['id'],"","","","hasEndCustomerPrice=true"));
        expect(response.statusCode).toBe(200)
        expect(response.body.length).toEqual(response.body.filter(t=>t.resellerPriceFinalSum>0).length)
    })

    test("Get Quotes - Assets - Filter - Show EOSL", async () => {
        let response =(await ahAPI.getQuotesAssetsWithParams(ahAPI.COMMON_TOKEN,testOrgId,testQuote['id'],"","","","hasEndOfServiceLifeDate=true"));
        expect(response.statusCode).toBe(200)
        expect(response.body.length).toEqual(response.body.filter(t=>t.supportLifeEndDate!=null).length)
    })


    test("Get Quotes - Assets - Filter - Non-Exising", async () => {
        let response =(await ahAPI.getQuotesAssetsWithParams(ahAPI.COMMON_TOKEN,testOrgId,testQuote['id'],"","","","hasEndCustomerPrice=blah"));
        expect(response.statusCode).toBe(200)
        //expect(response.body.message).toMatch("hasEndCustomerPrice: Expected boolean, received string");
    })

    test("Get Quote - Assets - Export as CSV", async () => {
        let response = await ahAPI.exportQuoteAssets(ahAPI.COMMON_TOKEN, TestData.defaultOrgId, testQuote['id'], "csv");
        expect(response.statusCode).toBe(200);
        expect(response.text.split("\n")[0]).toBe(`Name,ProductSku,SerialNumber,ServiceGroupLabel,ServiceGroupSku,CoverageStatus,Quantity,ResellerPriceFinalSum,EndCustomerPriceFinalSum,Currency,StartDate,EndDate,SupportLifeEndDate,QuoteNo,EndCustomer,GroupID,ReferenceId,QuoteExpirationDate,SvcLvlDescription`);
        expect(response.text).toContain(`HPE 3PAR 8000 3.84TB SAS cMLC Reman SSD,K2P91AR,058c92e66295e849,HPE Tech Care Essential SVC,HU4A6AC,EXPOSED,1,198.63,209.08,CHF,07/01/2024,09/30/2024,,DUM2383497725,Customer 51,2e19b37993e92f17,0058628543,06/30/2024,\"HU4A2AC; HPE Hardware Tech Support; Onsite Support; Replacement Parts; Essential Service Level,`);
    })

    test("Get Quote - Assets - Export as XLSX", async () => {
        let response = await ahAPI.exportQuoteAssets(ahAPI.COMMON_TOKEN, TestData.defaultOrgId, testQuote['id'], "xlsx");
        expect(response.statusCode).toBe(200);
        let xls_binary=response.body;
        let xlsx_content=await commonHelper.convertBinaryXlsxToCsv(xlsx.parse(xls_binary));
        expect(xlsx_content.split("\n")[0]).toBe(`Name,ProductSku,SerialNumber,ServiceGroupLabel,ServiceGroupSku,CoverageStatus,Quantity,ResellerPriceFinalSum,EndCustomerPriceFinalSum,Currency,StartDate,EndDate,SupportLifeEndDate,QuoteNo,EndCustomer,GroupID,ReferenceId,QuoteExpirationDate,SvcLvlDescription`);
        expect(xlsx_content).toContain(`HPE 3PAR 8000 3.84TB SAS cMLC Reman SSD,K2P91AR,058c92e66295e849,HPE Tech Care Essential SVC,HU4A6AC,EXPOSED,1,198.63,209.08,CHF,07/01/2024,09/30/2024,,DUM2383497725,Customer 51,2e19b37993e92f17,0058628543,06/30/2024,HU4A2AC; HPE Hardware Tech Support; Onsite Support; Replacement Parts; Essential Service Level,`);
    })

    test.each([{  format: "xlsx"},])
    ("Get Quote - Assets - Export as $format - Non-existing quoteId", async ({format}) => {
        let response =await ahAPI.exportQuoteAssets(ahAPI.COMMON_TOKEN, TestData.defaultOrgId, TestData.nonExisingId, format);
        expect(response.statusCode).toBe(404);
    })

    test.each([{  format: "csv" }])
    ("Get Quote - Assets - Export as $format - Non-existing orgId", async ({format}) => {
        let response =await ahAPI.exportQuoteAssets(ahAPI.COMMON_TOKEN, TestData.nonExisingId, testQuote['id'], format);
        expect(response.statusCode).toBe(403);
    })

    test("Get Quote - Assets - Export as CSV - Unauthorized", async () => {
        let response =await ahAPI.exportQuoteAssets("BLAH", TestData.nonExisingId, testQuote['id'], "csv");
        expect(response.statusCode).toBe(401);
    })

})

