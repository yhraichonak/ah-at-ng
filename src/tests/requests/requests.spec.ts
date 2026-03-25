import ahAPI from "../../api/SupertestAHAPIHelper";
import TestData from "../testdata";
import { test} from "@jest/globals";
import commonHelper from "../../api/CommonHelper";
const { matchersWithOptions } = require('jest-json-schema');
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));

afterEach(async () => {await ahAPI.clearCommonSession();})
beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
beforeAll(async () => {await TestData.initUsersAndRoles()})
describe('[jest] Requests', () => {
    let assets={
        sn1:"SN001",sn2:"SN002", sku1:"SKU001",sku2:"SKU002"
    }
    let defaultQuotesRequestExistingCustomer={
        "customerId": TestData.defaultEndUserDetails.id,
        "message": "Request for multiple items",
        "assets":"[" +
            "{  \"serialNumber\":\""+assets.sn1+"\",\"productSku\":\""+assets.sku1+"\",\"endDate\":\"2026-08-29T22:00:00.000Z\"," +
            "\"serviceGroupSku\":\"H7J36AC\",\"serviceGroupVendor\":\"274587\"," +
            "\"serviceGroupDescription\":\"HPE Foundation Care CTR Service\"}," +
            "{\"serialNumber\":\""+assets.sn2+"\",\"productSku\":\""+assets.sku2+"\",\"endDate\":\"2026-08-29T22:00:00.000Z\"," +
            "\"serviceGroupSku\":\"H7J36AC\",\"serviceGroupVendor\":\"274587\"," +
            "\"serviceGroupDescription\":\"HPE Foundation Care CTR Service\"}]"
    }
    test("Requests", async () => {
        const response = await ahAPI.getRequests( ahAPI.COMMON_TOKEN,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/quote_requests'})
    })

    test("Requests info", async () => {
        let response = await ahAPI.sendQuotesRequestMultipart(ahAPI.COMMON_TOKEN, TestData.defaultOrgId, defaultQuotesRequestExistingCustomer);
        expect(response.statusCode).toBe(200);
        response = await ahAPI.getRequests( ahAPI.COMMON_TOKEN,TestData.defaultOrgId,"?sortBy=createdAt&sortOrder=desc");
        let userId=TestData.defaultUserDetails.id
        let request_entity=await response.body.data.find((t)=>t.action==="REQUEST_QUOTE" && t.triggeredBy.userId=== userId )
        expect(request_entity.quoteId).toEqual(null);
        expect(request_entity.quoteNo).toEqual(null);
        expect(request_entity.ticketProvider).toEqual("freshdesk");
        expect(request_entity.ticketProviderStatus).toEqual("OPEN");
        expect(request_entity.ticketProviderUrl).toContain("https://testassethub.freshdesk.com/helpdesk/tickets/");
        expect(request_entity.user.id.toString()).toEqual(userId);
        expect(request_entity.triggeredBy.userId.toString()).toEqual(userId);
        expect(request_entity.request.assets[0].serialNumber).toEqual(assets.sn1);
        expect(request_entity.request.assets[0].productSku).toEqual(assets.sku1);
        expect(request_entity.request.assets[1].serialNumber).toEqual(assets.sn2);
        expect(request_entity.request.assets[1].productSku).toEqual(assets.sku2);
    })

    test("Requests - Pagination - Default", async () => {
        let response =await ahAPI.getRequests(ahAPI.COMMON_TOKEN,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(50)
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    })

    test.each([
        { attr:"quoteNo",order:"asc" },
        { attr:"quoteNo",order:"desc" },
        { attr:"action",order:"asc" },
        { attr:"action",order:"desc" },
        { attr:"createdAt",order:"asc" },
        { attr:"createdAt",order:"desc" },
        { attr:"updatedAt",order:"asc" },
        { attr:"updatedAt",order:"desc" },
    ])

    (`Requests - Sorting by $attr in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getRequests(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder:[]= response.body.data.map(t=>t[attr])
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order,false);
        expect(actualOrderString).toEqual(expectedOrderString);
    })

    test("Get Quotes - Pagination - $pages pages", async () => {
        let pages="3";
        let response =await ahAPI.getQuotesRequestsWithParams(ahAPI.COMMON_TOKEN,pages,"","","",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(parseInt(pages))
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    })


    test("Requests - Pagination - Invalid page size", async () => {
        let response =await ahAPI.getQuotesRequestsWithParams(ahAPI.COMMON_TOKEN,"blah","","","",TestData.defaultOrgId);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("limit: Expected number, received nan");
    })

    test("Requests - Pagination - Cursor", async () => {
        let entities20 =(await ahAPI.getQuotesRequestsWithParams(ahAPI.COMMON_TOKEN,"20","","","",TestData.defaultOrgId)).body.data;
        let response=await ahAPI.getQuotesRequestsWithParams(ahAPI.COMMON_TOKEN,"10","","","",TestData.defaultOrgId);
        let nextCursor=response.body.meta.nextCursor
        let quotesFirst10 =response.body.data;
        let quotesLast10 =(await ahAPI.getQuotesRequestsWithParams(ahAPI.COMMON_TOKEN,"10",nextCursor,"","",TestData.defaultOrgId)).body.data;
        expect(entities20.map(u=>u.id).join(",")).toContain(quotesFirst10.map(u=>u.id).join(","));
        expect(entities20.map(u=>u.id).join(",")).toContain((quotesLast10.map(u=>u.id)).join(","));
    })

    test("Requests - Pagination - No next page", async () => {
        let response =(await ahAPI.getQuotesRequestsWithParams(ahAPI.COMMON_TOKEN,"100","","CH11","",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBeLessThanOrEqual(100)
        expect(response.body.meta.hasNextPage).toBe(false)
        expect(response.body.meta.nextCursor).toBeNull();
    })

    test.each([
        {  attribute: "quoteNo", query: "DUM749023447" },
        {  attribute: "quoteNo", query:  "DUM749023447".substring(0,5)},
    ])
    ("Requests - Search - by $attribute", async ({attribute,query}) => {
        let response =(await ahAPI.getQuotesRequestsWithParams(ahAPI.COMMON_TOKEN,"","",query,"",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u[attribute]).join(",")).toBe(response.body.data.filter(u=>u[attribute].includes(query)).map(u=>u[attribute]).join(","))
    })

    test("Requests - Search without results", async () => {
        let response =(await ahAPI.getQuotesRequestsWithParams(ahAPI.COMMON_TOKEN,"","","blah","",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data).toHaveLength(0)})

    test("Requests - Filter - Status", async () => {
        let response =(await ahAPI.getQuotesRequestsWithParams(ahAPI.COMMON_TOKEN,"","","","status[]=OPEN",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(   response.body.data.map(u=>u.ticketProviderStatus).join(",")).toBe(response.body.data.filter(u=>u.ticketProviderStatus.startsWith("OPEN")).map(u=>u.ticketProviderStatus).join(","))
    })

    test("Requests - Filter - Multiple statuses", async () => {
        let response =(await ahAPI.getQuotesRequestsWithParams(ahAPI.COMMON_TOKEN,"","","","status[]=OPEN&status[]=IN_PROGRESS",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.ticketProviderStatus).join(",")).toBe(response.body.data.filter(u=>u.ticketProviderStatus.match("(OPEN|IN_PROGRESS)")).map(u=>u.ticketProviderStatus).join(","))
    })

    test("Get Quotes - Filter - Status - Non-Exising", async () => {
        let response =(await ahAPI.getQuotesRequestsWithParams(ahAPI.COMMON_TOKEN,"","","","status[]=BLAH",TestData.defaultOrgId));
        expect(response.statusCode).toBe(400)
        expect(response.body.message).toMatch("[\"status.0: Invalid input\"]");
    })

    test("Requests - Filter - Action", async () => {
        let response =(await ahAPI.getQuotesRequestsWithParams(ahAPI.COMMON_TOKEN,"","","","action[]=APPROVAL",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.action).join(",")).toBe(response.body.data.filter(u=>u.action.match("APPROVAL")).map(u=>u.action).join(","))
    })

    test("Requests - Filter - Multiple statuses", async () => {
        let response =(await ahAPI.getQuotesRequestsWithParams(ahAPI.COMMON_TOKEN,"","","","action[]=APPROVAL&action[]=DECLINE",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.action).join(",")).toBe(response.body.data.filter(u=>u.action.match("(APPROVAL|DECLINE)")).map(u=>u.action).join(","))
    })

    test("Requests - Filter - Action - Non-Exising", async () => {
        let response =(await ahAPI.getQuotesRequestsWithParams(ahAPI.COMMON_TOKEN,"","","","action[]=BLAH",TestData.defaultOrgId));
        expect(response.statusCode).toBe(400)
        expect(response.body.message).toBe("[\"action.0: Invalid input\"]");
    })

    test("Requests - Filter - Status and Action filters", async () => {
        let response =(await ahAPI.getQuotesRequestsWithParams(ahAPI.COMMON_TOKEN,"","","","status[]=IN_PROGRESS&action[]=APPROVAL",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>`${u.action}_${u.ticketProviderStatus}`).join(","))
            .toBe(response.body.data.filter(u=>u.action.match( "APPROVAL") && u.ticketProviderStatus.match( "IN_PROGRESS")).map(u=>`${u.action}_${u.ticketProviderStatus}`).join(","))
    })

    test("Requests - Unauthorized", async () => {
        const response = await ahAPI.getRequests("blah",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Requests - non-existing Org", async () => {
        const response = await ahAPI.getRequests(ahAPI.COMMON_TOKEN,TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    })

    test("Requests - Lack permission", async () => {
        let TOKEN=await ahAPI.getUserToken(TestData.restrictedUserDetails)
        const response = await ahAPI.getRequests(TOKEN,TestData.defaultOrgId);
        expect(response.statusCode).toBe(403);
    })

    test("Request Details", async () => {
        let response = await ahAPI.getRequestDetails(ahAPI.COMMON_TOKEN, TestData.defaultQuoteRequestId, TestData.defaultOrgId)
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/quote_request'})
    })
    test.each([
        {  action: "APPROVAL" },
        {  action: "DECLINE"},
        {  action: "REQUEST_CHANGE"},
        {  action: "REQUEST_QUOTE"},
    ])(`Request Details - Info $action`, async ({action}) => {
        let response = await ahAPI.getRequests(ahAPI.COMMON_TOKEN,  TestData.defaultOrgId, "?action[]="+action)
        let targetRequest=response.body.data.find(t=>t.action==action)
        expect(targetRequest.action).toBe(action)
        expect(targetRequest.ticketProviderId).toBeDefined();
        expect(targetRequest.ticketProviderStatus).toBeDefined();
        expect(targetRequest.ticketProviderUrl).toContain("https://testassethub.freshdesk.com/helpdesk/tickets/");
        expect(targetRequest.quoteId).toBeDefined();
        expect(targetRequest.quoteNo).toBeDefined();
        switch (action) {
            case "APPROVAL":
                expect(targetRequest.request.poNumber).toBeDefined();
                break;
            case "DECLINE":
                expect(targetRequest.request.declineReason).toBeDefined();
                break;
            case "REQUEST_CHANGE":
                expect(targetRequest.request.assets).toBeDefined();
                expect(targetRequest.request.message).toBeDefined();
                break;
            case "REQUEST_QUOTE":
                expect(targetRequest.request.customerName).toBeDefined();
                break;
        }
    })

    test("Request Details - Unauthorized", async () => {
        let response = await ahAPI.getRequestDetails("BLAH", TestData.defaultQuoteRequestId, TestData.defaultOrgId)
        expect(response.statusCode).toBe(401);
    })

    test("Request Details - Lack Permissions", async () => {
        let restricted_token= await ahAPI.getUserToken(TestData.restrictedUserDetails);
        let response = await ahAPI.getRequestDetails(restricted_token, TestData.defaultQuoteRequestId, TestData.defaultOrgId)
        expect(response.statusCode).toBe(403);
    })

    test("Request Details - unknown requestId", async () => {
        let response = await ahAPI.getRequestDetails(ahAPI.COMMON_TOKEN, TestData.nonExisingId, TestData.defaultOrgId)
        expect(response.statusCode).toBe(500);
        expect(response.body.message).toMatch(/Request history not found/);
    })


})