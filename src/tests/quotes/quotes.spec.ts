import ahAPI from "../../api/SupertestAHAPIHelper";
import commonHelper from "../../api/CommonHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import {jest, test} from "@jest/globals";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
const fs = require('fs');
import pdfParse from "pdf-parse";
const pdf = require('pdf-parse');
let testQuote=TestData.TEST_QUOTE_MAP[TestData.TEST_DATA_MODE];
describe('[jest] Quotes', () => {
    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {await TestData.initUsersAndRoles()},20000)

    test("Get Quotes", async () => {
        let response =await ahAPI.getQuotes(ahAPI.COMMON_TOKEN,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/quotes'})
    })

    test("Get Quotes - Quote Info", async () => {
        let response =await ahAPI.getQuotes(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, "?search="+testQuote["quoteNo"]);
        expect(response.statusCode).toBe(200);
        let target_entity=response.body.data.find(n=>n.quoteNo==testQuote["quoteNo"]);
        expect(target_entity.id).toEqual(testQuote["id"].toString());
        expect(target_entity.quoteNo).toEqual(testQuote["quoteNo"]);
        expect(target_entity.uiStatus).toEqual((typeof testQuote["status"] === "number")?
            TestData.STATUSES[testQuote["status"]]:testQuote["status"]);
        expect(target_entity.groupId).toEqual(testQuote["groupId"]);
        expect(target_entity.currency).toEqual(testQuote["currency"]);
    })

    test("Get Quotes - Pagination - Default", async () => {
        let response =await ahAPI.getQuotes(ahAPI.COMMON_TOKEN,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(50)
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
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

    (`Get Quotes - Sorting by $attr in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getQuotes(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder:[]= response.body.data.map(t=>( t[attr]?.name!==undefined)?t[attr].name:t[attr]);
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order,false);
        expect(actualOrderString).toEqual(expectedOrderString);
    })

    test.each([{ pages:"1" },])
    ("Get Quotes - Pagination - $pages pages", async ({pages}) => {
        let response =await ahAPI.getQuotesWithParams(ahAPI.COMMON_TOKEN,pages,"","","",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(parseInt(pages))
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    })


    test("Get Quotes - Pagination - Invalid page size", async () => {
        let response =await ahAPI.getQuotesWithParams(ahAPI.COMMON_TOKEN,"blah","","","",TestData.defaultOrgId);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("limit: Expected number, received nan");
    })

    test("Get Quotes - Pagination - Cursor", async () => {
        let entities20 =(await ahAPI.getQuotesWithParams(ahAPI.COMMON_TOKEN,"20","","","",TestData.defaultOrgId)).body.data;
        let response=await ahAPI.getQuotesWithParams(ahAPI.COMMON_TOKEN,"10","","","",TestData.defaultOrgId);
        let nextCursor=response.body.meta.nextCursor
        let quotesFirst10 =response.body.data;
        let quotesLast10 =(await ahAPI.getQuotesWithParams(ahAPI.COMMON_TOKEN,"10",nextCursor,"","",TestData.defaultOrgId)).body.data;
        expect(entities20.map(u=>u.id).join(",")).toContain(quotesFirst10.map(u=>u.id).join(","));
        expect(entities20.map(u=>u.id).join(",")).toContain((quotesLast10.map(u=>u.id)).join(","));
    })

    test("Get Quotes - Pagination - No next page", async () => {
        let response =(await ahAPI.getQuotesWithParams(ahAPI.COMMON_TOKEN,"100","","CH11","",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBeLessThanOrEqual(100)
        expect(response.body.meta.hasNextPage).toBe(false)
        expect(response.body.meta.nextCursor).toBeNull();
    })
    test("Get quotes - Pagination - Non-Existing cursor", async () => {
        let response =(await ahAPI.getQuotesWithParams(ahAPI.COMMON_TOKEN,"20","CH99999" ,"","",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBeLessThanOrEqual(20)
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    })
    test.each([
        { entity: "quotes", attribute: "quoteNo", query: "CH11" },
        { entity: "quotes", attribute: "groupId", query: "87-SMD500" },
        { entity: "quotes", attribute: "groupId", query: "SMD500" }
    ])
    ("Get $entity - Search - by $attribute", async ({entity,attribute,query}) => {
        let response =(await ahAPI.getQuotesWithParams(ahAPI.COMMON_TOKEN,"","",query,"",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u[attribute]).join(",")).toBe(response.body.data.filter(u=>u[attribute].includes(query)).map(u=>u[attribute]).join(","))
    })

    test("Get Quotes - Search without results", async () => {
        let response =(await ahAPI.getQuotesWithParams(ahAPI.COMMON_TOKEN,"","","blah","",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data).toHaveLength(0)})

    test.each([{ entity: "quotes", status: "status[]=Ordered", statusString: "Ordered" }])
    ("Get $entity - Filter - Status", async ({entity,status,statusString}) => {
        let response =(await ahAPI.getQuotesWithParams(ahAPI.COMMON_TOKEN,"","","",status,TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(   response.body.data.map(u=>u.uiStatus).join(",")).toBe(response.body.data.filter(u=>u.uiStatus.startsWith(statusString)).map(u=>u.uiStatus).join(","))
    })

    test.each([{ entity: "quotes", status: "status[]=Lost&status[]=Open", statusRegexp: "(Lost|Open)" }])
    ("Get Quotes - Get $entity - Filter - Multiple statuses", async ({entity,status,statusRegexp}) => {
        let response =(await ahAPI.getQuotesWithParams(ahAPI.COMMON_TOKEN,"","","",status,TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.uiStatus).join(",")).toBe(response.body.data.filter(u=>u.uiStatus.match(statusRegexp)).map(u=>u.uiStatus).join(","))
    })

    test("Get Quotes - Filter - Status - Non-Exising", async () => {
        let response =(await ahAPI.getQuotesWithParams(ahAPI.COMMON_TOKEN,"","","","status[]=BLAH",TestData.defaultOrgId));
        expect(response.statusCode).toBe(400)
        expect(response.body.message).toMatch("[\"status.0: Invalid enum value. Expected 'Open' | 'Change Requested' | 'Ordered' | 'Ready to Order' | 'Lost', received 'BLAH'\"]");
    })

    test.each([{filter:"type[]=RENEWAL"},
               {filter:"type[]=NET NEW"},
               {filter:"type[]=SERVICE PACK"},
               {filter:"type[]=RENEWAL&type[]=SERVICE PACK"},
    ])
    ("Get Quotes - Filter - Type $filter", async ({filter}) => {
        let response =(await ahAPI.getQuotesWithParams(ahAPI.COMMON_TOKEN,"","","",filter,TestData.altOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data).not.toHaveLength(0)
    })

    test("Get Quotes - Filter - Type - Non-Exising", async () => {
        let response =(await ahAPI.getQuotesWithParams(ahAPI.COMMON_TOKEN,"","","","type[]=BLAH",TestData.defaultOrgId));
        expect(response.statusCode).toBe(400)
        expect(response.body.message).toMatch(/type.*Invalid enum value.*Expected 'RENEWAL'.*'NET NEW'.*'SERVICE PACK'.*received 'BLAH'/);
    })

    test("Get Quotes - Filter - Vendor", async () => {
        let vendorName=TestData.defaultDistributorVendorDetails.name
        let response =await ahAPI.getQuotes(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, `?vendorNames[]=${vendorName}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u['vendor'].name.startsWith(vendorName)).map(u=>u.id).join(","))
    })

    test("Get Quotes - Filter - Multiple Vendors", async () => {
        let vendorName=TestData.defaultDistributorVendorDetails.name
        let vendor2Name=TestData.altVendorDetails.name
        let response =await ahAPI.getQuotes(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, `?vendorNames[]=${vendorName}&vendorNames[]=${vendor2Name}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u['vendor'].name.match(`(${vendorName}|${vendor2Name})`)).map(u=>u.id).join(","))
    })

    test("Get Quotes - Filter - Vendor - Non-matching", async () => {
        let response =await ahAPI.getQuotes(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, `?vendorNames[]=BLAH`);
        expect(response.body.data.length).toBe(0)
    })

    test("Get Quotes - Non-existing orgId", async () => {
        let response =await ahAPI.getQuotes(ahAPI.COMMON_TOKEN,TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    })
    test("Get Quotes - unauthorized", async () => {
        let response =await ahAPI.getQuotes("blah",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Quote - Get Quote", async () => {
        let response =await ahAPI.getQuote(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  testQuote['id']);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/quote_details'})
    })

    test("Quote - Get Quote Details", async () => {
        let response =await ahAPI.getQuote(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  testQuote['id']);
        expect(response.statusCode).toBe(200);
        expect(response.body.id).toEqual(testQuote["id"].toString());
        expect(response.body.quoteNo).toEqual(testQuote["quoteNo"]);
        expect(response.body.status).toMatch(new RegExp((typeof testQuote["status"] === "number")?
            TestData.STATUSES[testQuote["status"]]:testQuote["statusRegexp"]));
        expect(response.body.endCustomerId).toEqual(testQuote["endCustomerId"]);
        expect(response.body.vendorId).toEqual(testQuote["vendorId"].toString());
        expect(response.body.resellerId).toContain(testQuote["resellerId"].toString());
        expect(response.body.distributorId).toContain(testQuote["distributorId"].toString());
        expect(response.body.startDate).toEqual(testQuote["startDate"].toString());
        expect(response.body.endDate).toEqual(testQuote["endDate"].toString());
    })

    test("Quote - Get Quote - Unauthorized", async () => {
        let response =await ahAPI.getQuote("blah",TestData.defaultOrgId,  testQuote['id']);
        expect(response.statusCode).toBe(401);
    })
    test("Quote - Get Quote - Invalid orgId", async () => {
        let response =await ahAPI.getQuote(ahAPI.COMMON_TOKEN,TestData.nonExisingId,  testQuote['id']);
        expect(response.statusCode).toBe(403);
    })

    test("Quote - Get Quote - Invalid quoteId", async () => {
        let response =await ahAPI.getQuote(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,TestData.nonExisingId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(/Angebot.*nicht gefunden/);
    })

    test("Get Quote - PDF", async () => {
        let response =await ahAPI.getQuotePDF(ahAPI.COMMON_TOKEN,TestData.previewPDFOrgId,  TestData.defaultQuoteWithPDFId);
        expect(response.statusCode).toBe(200);
    },20000)

    test("Get Quote - PDF - Info", async () => {
        let fileWithPDFContent='file.pdf'
        let response =await ahAPI.getQuotePDF(ahAPI.COMMON_TOKEN,TestData.previewPDFOrgId,  TestData.defaultQuoteWithPDFId);
        expect(response.statusCode).toBe(200);
        await ahAPI.getPDFViaCURL(ahAPI.COMMON_TOKEN,TestData.previewPDFOrgId,  "quotes", TestData.defaultQuoteWithPDFId);
        let dataBuffer =  await fs.readFileSync(fileWithPDFContent);
        const textFromPDF = (await pdf(dataBuffer)).text;
        expect(textFromPDF).toContain(
`Kundendienstvereinbarung
Vertragsgruppe: 87-SMD501 924
Angebot (Renewal) - CH11060v1`);
    },20000)

    test("Get Quote - Download - With Prices", async () => {
        let textFromPDF =await ahAPI.getQuotePDFAndParse(ahAPI.COMMON_TOKEN,TestData.previewPDFOrgId,  TestData.defaultQuoteWithPDFId, "?printName=Brutto Quote");
        expect(textFromPDF.text).toContain(
            `Kundendienstvereinbarung
Vertragsgruppe: 87-SMD501 924
Angebot (Renewal) - CH11060v1`);
        expect(textFromPDF.text).toContain(`2’964.00`);
    },60000)


    test("Get Quote - Download - Without Prices", async () => {
        let textFromPDF =await ahAPI.getQuotePDFAndParse(ahAPI.COMMON_TOKEN,TestData.previewPDFOrgId,  TestData.defaultQuoteWithPDFId, "?printName=Quote No Pricing");
        expect(textFromPDF.text).toContain(
            `Kundendienstvereinbarung
Vertragsgruppe: 87-SMD501 924
Angebot (Renewal) - CH11060v1`);
        expect(textFromPDF.text).not.toContain(`2’964.00`);
    },60000)


    test("Get Quote - PDF - Unauthorized", async () => {
        let response =await ahAPI.getQuotePDF("blah",TestData.defaultOrgId,  TestData.defaultQuoteWithPDFId);
        expect(response.statusCode).toBe(401);
    })

    test("Get Quote - PDF - Lack Permissions", async () => {
        let restricted_token= await ahAPI.getUserToken(TestData.restrictedUserDetails);
        let response =await ahAPI.getQuotePDF(restricted_token,TestData.defaultOrgId, TestData.defaultQuoteWithPDFId);
        expect(response.statusCode).toBe(403);
    })

    test("Get Quote - PDF - non-existing quote", async () => {
        let response =await ahAPI.getQuotePDF(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  TestData.nonExisingId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(/Angebot.*nicht gefunden/);
    })

    test("Get Quote - PDF - non-existing org", async () => {
        let response =await ahAPI.getQuotePDF(ahAPI.COMMON_TOKEN,TestData.nonExisingId,  TestData.defaultQuoteWithPDFId);
        expect(response.statusCode).toBe(403);
    })

    test("Get Quote - PDF - No preview", async () => {
        let response =await ahAPI.getQuotePDF(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, "73574");
        expect(response.statusCode).toBe(404);
    })

    test("Get Quote - Contracts - Details", async () => {
        let response =await ahAPI.getQuoteContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId);
        expect(response.statusCode).toBe(200);
        let target_entity=response.body.data.find(t=>t.contractNumber === TestData.defaultQWCContract["contractNumber"]);
        expect(target_entity.id.toString()).toEqual(TestData.defaultQWCContract["id"].toString());
        expect(target_entity.contractNumber.toString()).toEqual(TestData.defaultQWCContract["contractNumber"].toString());
        expect(target_entity.sar.toString()).toEqual(TestData.defaultQWCContract["sar"].toString());
        expect(target_entity.groupId.toString()).toEqual(TestData.defaultQWCContract["groupId"].toString());
        expect(target_entity.startDate.toString()).toEqual(TestData.defaultQWCContract["startDate"].toString());
        expect(target_entity.endDate.toString()).toEqual(TestData.defaultQWCContract["endDate"].toString());
    },20000)

    test("Get Quote - Contracts - Empty list", async () => {
        let response =await ahAPI.getQuoteContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  TestData.quoteWithoutContracts);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(0);
    })

    test("Get Quote - Contracts - Non-existing quoteId", async () => {
        let response =await ahAPI.getQuoteContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  TestData.nonExisingId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(/Angebot.*nicht gefunden/);
    })

    test("Get Quote - Contracts - Unauthorized", async () => {
        let response =await ahAPI.getQuoteContracts("blah",TestData.defaultOrgId,  TestData.defaultQWCQuoteId);
        expect(response.statusCode).toBe(401);
    })

})

