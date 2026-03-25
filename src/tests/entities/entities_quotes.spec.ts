import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import commonHelper from "../../api/CommonHelper";
import {test} from "@jest/globals";

let testQuote=TestData.TEST_QUOTE_MAP[TestData.TEST_DATA_MODE];
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
describe('[jest] Entity Quotes', () => {
    let customerWithQuotes=TestData.defaultEndUserDetails.id;
    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {})

    test("Get Quotes", async () => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/quotes'})
    })

    test("Quote Info", async () => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithQuotes, "quotes", TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        let target_entity=response.body.data.find(n=>n.id==testQuote["id"]);
        expect(target_entity.quoteNo).toEqual(testQuote["quoteNo"]);
        expect(target_entity.uiStatus).toEqual((typeof testQuote["status"] === "number")?
            TestData.STATUSES[testQuote["status"]]:testQuote["status"]);
        expect(target_entity.groupId).toEqual(testQuote["groupId"]);
        expect(target_entity.currency).toEqual(testQuote["currency"]);
    })

    test("Pagination - Default", async () => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithQuotes, "quotes", TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBeLessThanOrEqual(50)
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
       //KNOWN: AH-539
        { attr:"endUser",order:"asc" },
        { attr:"endUser",order:"desc" },
        { attr:"resellerTotalPrice",order:"asc" },
        { attr:"resellerTotalPrice",order:"desc" },
        { attr:"endCustomerTotalPrice",order:"asc" },
        { attr:"endCustomerTotalPrice",order:"desc" }
    ])

    (`Sorting by $attr in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,
            customerWithQuotes,"quotes",TestData.defaultOrgId,`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder= response.body.data.map(t=>( t[attr]?.name!==undefined)?t[attr].name:t[attr]);
        origOrder=origOrder.filter((x) => x !== null);
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order,false);
        expect(actualOrderString).toEqual(expectedOrderString);
    })

    test("Pagination - 1 pages", async () => {
        let response =await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes","1","","","",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(1)
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    })

    test("Pagination - Invalid page size", async () => {
        let response =await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes","blah","","","",TestData.defaultOrgId);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("limit: Expected number, received nan");
    })

    test("Pagination - Cursor", async () => {
        let entities20 =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes","20","","","",TestData.defaultOrgId)).body.data;
        let response=await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes","10","","","",TestData.defaultOrgId);
        let nextCursor=response.body.meta.nextCursor
        let quotesFirst10 =response.body.data;
        let quotesLast10 =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes","10",nextCursor,"","",TestData.defaultOrgId)).body.data;
        expect(entities20.map(u=>u.id).join(",")).toContain(quotesFirst10.map(u=>u.id).join(","));
        expect(entities20.map(u=>u.id).join(",")).toContain((quotesLast10.map(u=>u.id)).join(","));
    })

    test("Pagination - No next page", async () => {
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes","100","","CH11","",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBeLessThanOrEqual(100)
        expect(response.body.meta.hasNextPage).toBe(false)
        expect(response.body.meta.nextCursor).toBeNull();
    })
    test("Pagination - Non-Existing cursor", async () => {
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes","10","blah","","",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).not.toBeGreaterThan(10)
        expect(response.body.meta.hasNextPage).toBe(false)
        expect(response.body.meta.nextCursor).toBeNull();
    })
    test.each([
        { entity: "quotes", attribute: "quoteNo", query: "CH11" },
        { entity: "quotes", attribute: "groupId", query: "87-SMD500" },
        { entity: "quotes", attribute: "groupId", query: "SMD500" }
    ])
    ("Search - by $attribute", async ({entity,attribute,query}) => {
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes","","",query,"",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u[attribute]).join(",")).toBe(response.body.data.filter(u=>u[attribute].includes(query)).map(u=>u[attribute]).join(","))
    })

    test("Search without results", async () => {
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes","","","blah","",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data).toHaveLength(0)})

    test("Filter - Status", async () => {
        let status= "status[]=Ordered";
        let statusString= "Ordered";
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes","","","",status,TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(   response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u.uiStatus.startsWith(statusString)).map(u=>u.id).join(","))
    })

    test("Filter - Multiple statuses", async () => {
        let status= "status[]=Lost&status[]=Open";
        let statusRegexp= "(Lost|Open)";
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes","","","",status,TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u.uiStatus.match(statusRegexp)).map(u=>u.id).join(","))
    })

    test("Filter - Status - Non-Exising", async () => {
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes","","","","status[]=BLAH",TestData.defaultOrgId));
        expect(response.statusCode).toBe(400)
        expect(response.body.message).toMatch("[\"status.0: Invalid enum value. Expected 'Open' | 'Change Requested' | 'Ordered' | 'Ready to Order' | 'Lost', received 'BLAH'\"]");
    })

    test.each([
               {filter:"type[]=RENEWAL"},
               {filter:"type[]=NET NEW"},
               {filter:"type[]=SERVICE PACK"},
               {filter:"type[]=RENEWAL&type[]=SERVICE PACK"}
    ])
    ("Get Quotes - Filter - Type $filter", async ({filter}) => {
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,TestData.altEndUserDetails.id,"quotes","","","",filter,TestData.altOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data).not.toHaveLength(0)
    })


    test("Filter - Type - Non-Exising", async () => {
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes","","","","type[]=BLAH",TestData.defaultOrgId));
        expect(response.statusCode).toBe(400)
        expect(response.body.message).toMatch(/type.*Invalid enum value.*Expected 'RENEWAL'.*'NET NEW'.*'SERVICE PACK'.*received 'BLAH'/);
    })

    test("Filter - Vendor", async () => {
        let vendorName=TestData.defaultDistributorVendorDetails.name
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes", TestData.defaultOrgId,`?vendorNames[]=${vendorName}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u['vendor'].name.startsWith(vendorName)).map(u=>u.id).join(","))
    })

    test("Filter - Multiple Vendors", async () => {
        let vendorName=TestData.defaultDistributorVendorDetails.name
        let vendor2Name=TestData.altVendorDetails.name
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes", TestData.defaultOrgId,`?vendorNames[]=${vendorName}&vendorNames[]=${vendor2Name}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u['vendor'].name.match(`(${vendorName}|${vendor2Name})`)).map(u=>u.id).join(","))
    })

    test("Filter - Vendor - Non-matching", async () => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes",TestData.defaultOrgId, `?vendorNames[]=BLAH`);
        expect(response.body.data.length).toBe(0)
    })

    test("Non-existing orgId", async () => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithQuotes,"quotes",TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    })
    test("Unauthorized", async () => {
        let response =await ahAPI.getEntityItems("blah",customerWithQuotes,"quotes",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

})

