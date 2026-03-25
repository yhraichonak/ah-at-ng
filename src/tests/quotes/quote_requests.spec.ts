import ahAPI from "../../api/SupertestAHAPIHelper";
import commonHelper from "../../api/CommonHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import {test} from "@jest/globals";
import * as allure from "allure-js-commons";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
describe('[jest] Quotes - Requests', () => {
    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {await TestData.initUsersAndRoles()},20000)

    test("Requests schema", async () => {
        let response =await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/quote_requests'})
    })

    test.each([{ pages:"5" },])
    ("Pagination - $pages pages", async ({pages}) => {
        let response =await ahAPI.getQuoteRequestHistoryWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId,pages,"");
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(parseInt(pages))
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    })


    test("Pagination - Invalid page size", async () => {
        let response =await ahAPI.getQuoteRequestHistoryWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId,"blah","");
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("limit: Expected number, received nan");
    })

    test("Pagination - Cursor", async () => {
        let entities20 =(await ahAPI.getQuoteRequestHistoryWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId,"20","")).body.data;
        let response=await ahAPI.getQuoteRequestHistoryWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId,"10","");
        let nextCursor=response.body.meta.nextCursor
        let quotesFirst10 =response.body.data;
        let quotesLast10 =(await ahAPI.getQuoteRequestHistoryWithParams(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId,"10",nextCursor)).body.data;
        expect(entities20.map(u=>u.id).join(",")).toContain(quotesFirst10.map(u=>u.id).join(","));
        expect(entities20.map(u=>u.id).join(",")).toContain((quotesLast10.map(u=>u.id)).join(","));
    })

    test("No data", async () => {
        let response =await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQuoteWithoutRequests.id);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(0)
    })

    test("Non-existing quote", async () => {
        let response =await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, "99999");
        expect(response.statusCode).toBe(404);
    })


    test("Non-existing org", async () => {
        let response =await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.nonExisingId, TestData.defaultQuoteWithoutRequests.id);
        expect(response.statusCode).toBe(403);
    })


    test("Get Quote - Requests - Unauthorized", async () => {
        let response =await ahAPI.getQuoteRequestHistory("BLAH",TestData.defaultOrgId, TestData.defaultQWCQuoteId);
        expect(response.statusCode).toBe(401);
    })

    test("Lack Permissions", async () => {
        let restricted_token= await ahAPI.getUserToken(TestData.restrictedUserDetails);
        let response =await ahAPI.getQuoteRequestHistory(restricted_token,TestData.defaultOrgId, TestData.defaultQWCQuoteId);
        expect(response.statusCode).toBe(403);
    })

    test("Details - Request changes", async () => {
        let request_type="REQUEST_CHANGE";
        let request_message="Request message";
        let cancellation_reason="Other";
        let response=await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId);
        if (response.body.data===undefined ||  response.body.data.find(t=>t.action == request_type)==undefined){
            await ahAPI.sendQuoteChangeRequest(ahAPI.COMMON_TOKEN,
                TestData.defaultOrgId, TestData.defaultQWCQuoteId,
                {"message": request_message, "cancellationReason": cancellation_reason,
                    "assets": [TestData.changeAsset2, TestData.deleteAsset2]});
            response =await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId);
         }
        expect(response.statusCode).toBe(200);
        let userId=TestData.defaultUserDetails.id
        let request_entity=await response.body.data.find((t)=>t.action===request_type && t.user.id=== userId && t.request.message.includes(request_message) )
        expect(request_entity.quoteId.toString()).toEqual(TestData.defaultQWCQuoteId);
        expect(request_entity.user.id.toString()).toEqual(userId);
        expect(request_entity.request.userId.toString()).toEqual(userId);
        expect(request_entity.request.message.toString()).toMatch(new RegExp(request_message,"s"));
        expect(request_entity.request.quoteNumber.toString()).toEqual(TestData.defaultQWCQuote.quoteNo);
        expect(request_entity.request.cancellationReason.toString()).toMatch(new RegExp(`${cancellation_reason}|My Cancellation reason`,"s"));
        expect(request_entity.request.assets[0].serialNumber).toEqual(TestData.changeAsset2.serialNumber);
        expect(request_entity.request.assets[0].productSku).toEqual(TestData.changeAsset2.productSku);
        expect(request_entity.request.assets[0].newServiceGroupSku).toEqual(TestData.changeAsset2.newServiceGroupSku);
        expect(request_entity.request.assets[0].newServiceGroupVendor).toEqual(TestData.changeAsset2.newServiceGroupVendor);
        expect(request_entity.request.assets[0].oldServiceGroupSku).toEqual(TestData.changeAsset2.oldServiceGroupSku);
        expect(request_entity.request.assets[0].oldServiceGroupVendor).toEqual(TestData.changeAsset2.oldServiceGroupVendor);
        expect(request_entity.request.assets[1].serialNumber).toEqual(TestData.deleteAsset2.serialNumber);
        expect(request_entity.request.assets[1].productSku).toEqual(TestData.deleteAsset2.productSku);
    })

    test("Details - Approve", async () => {
        let request_type="APPROVAL";
        let comment="AT comment";
        let po_number="AT PO number";
        let response =await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId);
        if (response.body.data===undefined ||  response.body.data.find(t=>t.action == request_type)==undefined){
            await ahAPI.sendQuoteApproveRequest(ahAPI.COMMON_TOKEN, TestData.defaultQWCQuoteId,
                "src/tests/poFile.pdf", comment, po_number, TestData.defaultOrgId);
            response =await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId);
        }
        expect(response.statusCode).toBe(200);
        let request_entity=await response.body.data.find((t)=>t.action===request_type)
        expect(request_entity.quoteId.toString()).toEqual(TestData.defaultQWCQuoteId);
        expect(request_entity.request.quoteNumber.toString()).toEqual(TestData.defaultQWCQuote.quoteNo);
        expect(request_entity.request.comment.toString()).toEqual(comment);
        expect(request_entity.request.poNumber.toString()).toEqual(po_number);
    })

    test("Details - Decline", async () => {
        let request_type="DECLINE";
        let decline_reason="AT decline reason"
        let response =await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId);
        if (response.body.data===undefined ||  response.body.data.find(t=>t.action == request_type)==undefined){
            await ahAPI.sendQuoteDeclineRequest(ahAPI.COMMON_TOKEN,TestData.defaultQWCQuote.id,decline_reason, TestData.defaultOrgId);
            response =await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId);
        }
        expect(response.statusCode).toBe(200);
        let request_entity=await response.body.data.find((t)=>t.action===request_type)
        expect(request_entity.quoteId.toString()).toEqual(TestData.defaultQWCQuoteId);
        expect(request_entity.quoteNo.toString()).toEqual(TestData.defaultQWCQuote.quoteNo);
    })

    test.each([
        { attr:"action",order:"asc" },
        { attr:"action",order:"desc" },
        { attr:"createdAt",order:"asc" },
        { attr:"createdAt",order:"desc" },
        { attr:"updatedAt",order:"asc" },
        { attr:"updatedAt",order:"desc" },
    ])
    (`Sorting by $attr in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId,`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder:[]= response.body.data.map(t=>t[attr])
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order,false);
        expect(actualOrderString).toEqual(expectedOrderString);
    })

    test("Filter - Status", async () => {
        let response =(await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId,`?quoteId=${TestData.defaultQWCQuoteId}&status[]=IN_PROGRESS`));
        expect(response.statusCode).toBe(200)
        expect(   response.body.data.map(u=>u.ticketProviderStatus).join(",")).toBe(response.body.data.filter(u=>u.ticketProviderStatus.startsWith("IN_PROGRESS")).map(u=>u.ticketProviderStatus).join(","))
    })

    test("Filter - Multiple statuses", async () => {
        let response =(await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId,"?status[]=OPEN&status[]=IN_PROGRESS"));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.ticketProviderStatus).join(",")).toBe(response.body.data.filter(u=>u.ticketProviderStatus.match("(OPEN|IN_PROGRESS)")).map(u=>u.ticketProviderStatus).join(","))
    })

    test("Filter - Action", async () => {
        let response =(await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId,"?action[]=APPROVAL"));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.action).join(",")).toBe(response.body.data.filter(u=>u.action.match("APPROVAL")).map(u=>u.action).join(","))
    })

    test("Filter - Multiple statuses", async () => {
        let response =(await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId,"?action[]=DECLINE",));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.action).join(",")).toBe(response.body.data.filter(u=>u.action.match( "(APPROVAL|DECLINE)")).map(u=>u.action).join(","))
    })

    test("Filter - Status and Action filter", async () => {
        let response =(await ahAPI.getQuoteRequestHistory(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, TestData.defaultQWCQuoteId,"?action[]=APPROVAL&status[]=OPEN",));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>`${u.action}_${u.ticketProviderStatus}`).join(","))
            .toBe(response.body.data.filter(u=>u.action.match( "APPROVAL") && u.ticketProviderStatus.match( "OPEN")).map(u=>`${u.action}_${u.ticketProviderStatus}`).join(","))
    })


})

