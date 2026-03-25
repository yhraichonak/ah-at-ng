import ahAPI from "../../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import * as allure from "allure-js-commons";
import TestData from "../../testdata";
import freshdeskHelper from "../../../api/FreshdeskHelper";
import {expect, test} from '@jest/globals';
module.exports = { testRunner: 'jest-circus/runner' };
import gmailHelper from "../../../api/GmailHelper";
import {sleep} from "../../../api/utils";
import ahDbHelper from "../../../api/AHDBHelper";

expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testOrgId=TestData.defaultOrgId

describe('[jest] Quotes Requests - Integrations', () => {
    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
    })

    beforeAll(async () => {
        await TestData.initUsersAndRoles()
        await gmailHelper.authorize()
    })
    afterAll(async () => {
        await gmailHelper.readEmails(TestData.quoteRequestMessageFilter)
        await gmailHelper.readEmails(TestData.quoteRequestNewCustomerMessageFilter)
    })

    test("Quote - Request Quotes - Existing Customer", async () => {
        let new_item_id
        try {
            let fd_tickets = (await freshdeskHelper.search_recent_ticket("type:'New Business'")).results;
            let response = await ahAPI.sendQuotesRequestMultipart(ahAPI.COMMON_TOKEN, testOrgId, TestData.defaultQuotesRequestExistingCustomer);
            expect(response.statusCode).toBe(200);
            new_item_id = await freshdeskHelper.wait_for_new_ticket("type:'New Business'", fd_tickets)
            let fd_ticket_details = await freshdeskHelper.get_ticket_details(new_item_id);
            expect(fd_ticket_details.description_text).toMatch(/.*The following assets have been requested for quoting.*/s);
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*${ TestData.defaultEndUserDetails.name}.*`,"s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*SN001.*SKU001.*HPE Foundation Care CTR Service.*H7J36AC.*29\/08\/2026.*`,"s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*SN002.*SKU002.*HPE Foundation Care CTR Service.*H7J36AC.*29\/08\/2026 .*`,"s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Comment.*${TestData.defaultQuotesRequestExistingCustomer.message}.*`,"s"));
        }
        catch (e){throw e;} finally {if (new_item_id!==undefined) {await freshdeskHelper.delete_ticket(new_item_id);}}
    },60000)

    test("Quote - Request Quotes - Existing Customer - Email", async () => {
        await ahAPI.updateTestOrganization({"locale": "en"});
        await gmailHelper.readEmails(TestData.quoteRequestMessageFilter)
            let response = await ahAPI.sendQuotesRequestMultipart(ahAPI.COMMON_TOKEN, testOrgId, TestData.defaultQuotesRequestExistingCustomer);
            expect(response.statusCode).toBe(200);
            let quote_request_email_detail=await gmailHelper.waitForNewMessage(TestData.quoteRequestMessageFilter)
            let quote_request_message= await gmailHelper.getPlainHTMLFromMessage(quote_request_email_detail,0)
            let email_body=quote_request_message.body.textContent
            expect(email_body).toMatch(/.*Quote Request Confirmation*/s);
            expect(email_body).toMatch(/.*Your Request:*/s);
            expect(email_body).toMatch(new RegExp(`.*End Customer.*${ TestData.defaultEndUserDetails.name}.*`,"s"));
            expect(email_body).toMatch(new RegExp(`.*SN001.*SKU001.*H7J36AC.*29.08.2026.*`,"s"));
            expect(email_body).toMatch(new RegExp(`.*SN002.*SKU002.*H7J36AC.*29.08.2026.*`,"s"));
            expect(email_body).toMatch(new RegExp(`.*Message.*${TestData.defaultQuotesRequestExistingCustomer.message}.*`,"s"));
    },60000)

    test("Quote - Request Changes", async () => {
        let new_item_id
        try {
            let fd_ticket=(await freshdeskHelper.search_recent_ticket("type:'Quote change'")).results ;
            let cReason="No Response";
            let response =await ahAPI.sendQuoteChangeRequest(ahAPI.COMMON_TOKEN,
                testOrgId,
                TestData.defaultQuoteChangeRequestId, {
                    "message":"Request message",
                    "cancellationReason":cReason,
                    "assets":[
                        TestData.changeAsset,
                        TestData.deleteAsset
                    ]
                });
            expect(response.statusCode).toBe(200);
            new_item_id=await freshdeskHelper.wait_for_new_ticket("type:'Quote change'",fd_ticket,20)
            let fd_ticket_details= await freshdeskHelper.get_ticket_details(new_item_id);
            expect(fd_ticket_details.description_text).toMatch(/.*General Request.*Request message.*/s);
            expect(fd_ticket_details.description_text).toMatch(/.*Assets Changes|Service Group Changes.*/s);
            let cha=TestData.changeAsset
            let patter=`.*${cha.serialNumber}.*${cha.productSku}.*${cha.newServiceGroupSku}.*${cha.oldServiceGroupSku}.*`;
            expect(fd_ticket_details.description_text).toMatch(new RegExp(patter,"s"));
            expect(fd_ticket_details.description_text).toMatch(
                new RegExp(`.*${TestData.deleteAsset.serialNumber}.*${TestData.deleteAsset.productSku}.*`,"s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Cancellation Reason.*${cReason}.*`,"s"));
        }
        catch (e){throw e;} finally {if (new_item_id!==undefined) {await freshdeskHelper.delete_ticket(new_item_id);}}
    },60000)

    test.each([
        { newStatus:"Open", targetStatus:"OPEN", },
        { newStatus:"Pending",targetStatus:"IN_PROGRESS"  },
        { newStatus:"Resolved",targetStatus:"CLOSED"  },
        { newStatus:"Closed",targetStatus:"CLOSED"  },
        { newStatus:"Waiting on Customer",targetStatus:"IN_PROGRESS"  },
        { newStatus:"Waiting on Third Party",targetStatus:"IN_PROGRESS"  },
    ])(`Quote - Request - FreshDesk ticket status update - $newStatus`, async ({newStatus,targetStatus}) => {
        let requestDetails = await ahAPI.getRequestDetails(ahAPI.COMMON_TOKEN, TestData.defaultQuoteRequestId, testOrgId)
        let fdTicket = requestDetails.body.ticketProviderId;
        await freshdeskHelper.change_ticket_status(fdTicket, newStatus)
        await sleep(1)
        requestDetails = await ahAPI.getRequestDetails(ahAPI.COMMON_TOKEN, TestData.defaultQuoteRequestId, testOrgId)
        expect(requestDetails.body.ticketProviderStatus).toBe(targetStatus)
    })

   test(`Quote - Request - FreshDesk ticket status update - Deleted`, async () => {
       let fdTicket
       try {
           let requestDetails = await ahAPI.getRequestDetails(ahAPI.COMMON_TOKEN, TestData.defaultQuoteRequestId, testOrgId)
           fdTicket = requestDetails.body.ticketProviderId;
           await freshdeskHelper.delete_ticket(fdTicket)
           await sleep(1)
           requestDetails = await ahAPI.getRequestDetails(ahAPI.COMMON_TOKEN, TestData.defaultQuoteRequestId, testOrgId)
            expect(requestDetails.body.message).toMatch(/.*Request history not found.*/m)
       }finally {
           await ahDbHelper.undeleteRequest(TestData.defaultQuoteRequestId)
           if (fdTicket!==undefined){await freshdeskHelper.restore_ticket(fdTicket)}
       }
    })

    test("Quote - Request Quotes - New Customer", async () => {
        let new_item_id
        try {
            let fd_tickets = (await freshdeskHelper.search_recent_ticket("type:'New Business'")).results;
            let response = await ahAPI.sendQuotesRequestMultipart(ahAPI.COMMON_TOKEN, testOrgId, TestData.defaultQuotesRequestNewCustomer);
            expect(response.statusCode).toBe(200);
            new_item_id = await freshdeskHelper.wait_for_new_ticket("type:'New Business'", fd_tickets,20, "New customer")
            let fd_ticket_details = await freshdeskHelper.get_ticket_details(new_item_id);
            expect(fd_ticket_details.description_text).toMatch(/.*The following assets have been requested for quoting.*/s);
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*${ TestData.defaultQuotesRequestNewCustomer.customerName}.*`,"s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*SN001.*SKU001.*HPE Foundation Care CTR Service.*H7J36AC.*29\/08\/2026.*`,"s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*SN002.*SKU002.*HPE Foundation Care CTR Service.*H7J36AC.*29\/08\/2026 .*`,"s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Comment.*${TestData.defaultQuotesRequestNewCustomer.message}.*`,"s"));
        }
        catch (e){throw e;} finally {if (new_item_id!==undefined) {await freshdeskHelper.delete_ticket(new_item_id);}}
    },60000)

    test("Quote - Request Quotes - New Customer - Email", async () => {
            await ahAPI.postMe(ahAPI.COMMON_TOKEN, {firstName:TestData.defaultUserDetails.fname, lastName:TestData.defaultUserDetails.lname, "locale": "en"});
            await ahAPI.updateTestOrganization({"locale": "en"});
            await gmailHelper.readEmails(TestData.quoteRequestNewCustomerMessageFilter)
            let response = await ahAPI.sendQuotesRequestMultipart(ahAPI.COMMON_TOKEN, testOrgId, TestData.defaultQuotesRequestNewCustomer);
            expect(response.statusCode).toBe(200);
            let quote_request_email_detail=await gmailHelper.waitForNewMessage(TestData.quoteRequestNewCustomerMessageFilter,40000)
            let quote_request_message= await gmailHelper.getPlainHTMLFromMessage(quote_request_email_detail,0)
            let email_body=quote_request_message.body.textContent
            expect(email_body).toMatch(/.*Quote Request Confirmation*/s);
            expect(email_body).toMatch(/.*Your Request:*/s);
            expect(email_body).toMatch(new RegExp(`.*End Customer.*${ TestData.defaultQuotesRequestNewCustomer.customerName}.*`,"s"));
            expect(email_body).toMatch(new RegExp(`.*SN001.*SKU001.*H7J36AC.*29.08.2026.*`,"s"));
            expect(email_body).toMatch(new RegExp(`.*SN002.*SKU002.*H7J36AC.*29.08.2026.*`,"s"));
            expect(email_body).toMatch(new RegExp(`.*Message.*${TestData.defaultQuotesRequestNewCustomer.message}.*`,"s"));
    },60000)

    test("Quote - Decline", async () => {
        await ahDbHelper.set_quote_status(TestData.defaultQWCQuote.quoteNo, "Open")
        let new_item_id
        try {
            let decline_reason="AT decline reason"
            let fd_tickets=(await freshdeskHelper.search_recent_ticket("type:'Declined'")).results ;
            let response =await ahAPI.sendQuoteDeclineRequest(ahAPI.COMMON_TOKEN,TestData.defaultQWCQuote.id,decline_reason, testOrgId);
            expect(response.statusCode).toBe(200);
            new_item_id=await freshdeskHelper.wait_for_new_ticket("type:'Declined'",fd_tickets,20)
            let fd_ticket_details= await freshdeskHelper.get_ticket_details(new_item_id);
            expect(fd_ticket_details.description_text)
                .toMatch( new RegExp(`.*The quote ${TestData.defaultQWCQuote.quoteNo} was declined.*${decline_reason}.*`, 's'));
        }
        catch (e){throw e;} finally {if (new_item_id!==undefined) {await freshdeskHelper.delete_ticket(new_item_id);}}
    },60000)

    test("Quote - Decline - No reason", async () => {
        await ahDbHelper.set_quote_status(TestData.defaultQWCQuote.quoteNo, "Open")
        let new_item_id
        try {
            let fd_tickets=(await freshdeskHelper.search_recent_ticket("type:'Declined'")).results ;
            let response =await ahAPI.sendQuoteDeclineRequest(ahAPI.COMMON_TOKEN,TestData.defaultQWCQuote.id,"", testOrgId);
            expect(response.statusCode).toBe(200);
            new_item_id=await freshdeskHelper.wait_for_new_ticket("type:'Declined'",fd_tickets,20)
            let fd_ticket_details= await freshdeskHelper.get_ticket_details(new_item_id);
            expect(fd_ticket_details.description_text)
                .toMatch( new RegExp(`.*The quote ${TestData.defaultQWCQuote.quoteNo} was declined.*`, 's'));
        }
        catch (e){throw e;} finally {if (new_item_id!==undefined) {await freshdeskHelper.delete_ticket(new_item_id);}}
    },60000)

    test("Quote - Approve", async () => {
        await ahDbHelper.set_quote_status(TestData.defaultQWCQuote.quoteNo, "Open")
        let new_item_id
        try {
            let fd_tickets = (await freshdeskHelper.search_recent_ticket("type:'Approved'")).results;
            let response = await ahAPI.sendQuoteApproveRequest(ahAPI.COMMON_TOKEN, TestData.defaultQWCQuoteId, "src/tests/poFile.pdf", "AT comment", "AT PO number", TestData.defaultOrgId);
            expect(response.statusCode).toBe(200);
            new_item_id = await freshdeskHelper.wait_for_new_ticket("type:'Approved'", fd_tickets, 20)
            let fd_ticket_details = await freshdeskHelper.get_ticket_details(new_item_id);
            expect(fd_ticket_details.description_text)
                .toMatch(/.*The quote DUM1502683237 was approved.*Reseller Price:.*CHF.*48,014.63.*PO Number:.*AT PO number.*Comment:.*AT comment.*/s);
        }
        catch (e){throw e;} finally {if (new_item_id!==undefined) {await freshdeskHelper.delete_ticket(new_item_id);}}
    }, 60000)

    test("Quote - Approve - Email", async () => {
        let fd_tickets = (await freshdeskHelper.search_recent_ticket("type:'Approved'")).results;
        await ahDbHelper.set_quote_status(TestData.defaultQWCQuote.quoteNo, "Open")
        let payload = {firstName:TestData.defaultUserDetails.fname, lastName:TestData.defaultUserDetails.lname, "locale": "en"}
        await ahAPI.postMe(ahAPI.COMMON_TOKEN, payload);
            await gmailHelper.readEmails(TestData.quoteConfirmationMessageFilter)
            let response = await ahAPI.sendQuoteApproveRequest(ahAPI.COMMON_TOKEN, TestData.defaultQWCQuoteId, "src/tests/poFile.pdf", "AT comment", "AT PO number", TestData.defaultOrgId);
        if (response.statusCode!=200){
            throw new Error(`Error occurred on attempting to approve quotes. [${response.statusCode}] ${response.body.message}`);
        }
        await freshdeskHelper.wait_for_new_ticket("type:'Approved'", fd_tickets, 20)
        let quote_request_email_detail=await gmailHelper.waitForNewMessage(TestData.quoteConfirmationMessageFilter)
        let quote_request_message= await gmailHelper.getPlainHTMLFromMessage(quote_request_email_detail,0)
        let email_body=quote_request_message.body.textContent
        expect(email_body).toMatch(new RegExp(`.*We have received your order for the quote.*${TestData.defaultQWCQuote.quoteNo}.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Quote Number.*${TestData.defaultQWCQuote.quoteNo}.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*PO Number.*AT PO number.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Start Date.*01.09.2024.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Purchase Price.*CHF.*48,014.63.*`,"s"));
    }, 60000)

    test.each([
         { paymentDetails:TestData.altSgDefaultDetails,paymentDetailsFull:TestData.altSgDefaultDetailsFull,  description:"Default option", },
         { paymentDetails:TestData.altSgAltDetails,paymentDetailsFull:TestData.altSgAltDetailsFull, description:"Other option"}
    ])(`SP Quote - Approve - $description`, async ({paymentDetails,paymentDetailsFull,description}) => {
        let new_item_id
        try{
            await ahDbHelper.set_quote_status(TestData.altSPQuote.quoteNo, "Open")
            await ahAPI.updateServicePackQuote(ahAPI.COMMON_TOKEN,TestData.altServicePack.id, TestData.altSPQuote.id,paymentDetailsFull, TestData.altOrgId);
            let approvePayload=structuredClone(TestData.spAltQuoteApproveDetails);
            let asset=TestData.altSPQuoteAsset
            approvePayload.sgSKU=paymentDetails.sgSKU
            approvePayload.sgName=paymentDetails.sgName
            approvePayload.sgYears=paymentDetails.sgYears
            approvePayload.sgPrice=paymentDetails.sgPrice
            approvePayload.sgPriceStr=paymentDetails.sgResellerPriceStr
            approvePayload.sgCurrency=paymentDetails.sgCurrency
            let fd_tickets = (await freshdeskHelper.search_recent_ticket("type:'Approved'")).results;
            let response = await ahAPI.sendSPQuoteApproveRequest(ahAPI.COMMON_TOKEN, TestData.altServicePack.id, TestData.altSPQuote.id, approvePayload, TestData.altOrgId);
            expect(response.statusCode).toBe(200);
            new_item_id = await freshdeskHelper.wait_for_new_ticket("type:'Approved'", fd_tickets, 20,  approvePayload.sgSKU)
            let fd_ticket_details = await freshdeskHelper.get_ticket_details(new_item_id);
            let ticket_description=fd_ticket_details.description_text
            expect(ticket_description).toMatch(new RegExp(`.*The quote *${TestData.altSPQuote.quoteNo} was approved for the service pack ${TestData.altServicePack.name}.*`,"s"));
            expect(ticket_description).toMatch(new RegExp(`Reseller Price:.*${approvePayload.sgCurrency}.*${approvePayload.sgPriceStr}.*PO Number:.*${approvePayload.poNumber}`,"s"));
            expect(ticket_description).toMatch(new RegExp(`Product Name.*Product SKU.*SN.*Service Group.*Service Group SKU`,"s"));
            expect(ticket_description).toMatch(new RegExp(`${asset.productName}.*${asset.sku}.*${asset.serialNUmber}.*${approvePayload.sgName}.*${approvePayload.sgSKU}`,"s"));
        }
        catch (e){throw e;} finally {if (new_item_id!==undefined) {
            await freshdeskHelper.delete_ticket(new_item_id);
        }}
    }, 60000);

    test("{KNOWN ISSUE}: SP Quote - Approve - Email", async () => {
        await allure.issue("AH-1387")
        await ahDbHelper.set_quote_status(TestData.altSPQuote.quoteNo, "Open")
        let payload = {firstName:TestData.defaultUserDetails.fname, lastName:TestData.defaultUserDetails.lname, "locale": "en"}
        await ahAPI.postMe(ahAPI.COMMON_TOKEN, payload);
        await gmailHelper.readEmails(TestData.spQuoteConfirmationMessageFilter)
        let fd_tickets = (await freshdeskHelper.search_recent_ticket("type:'Approved'")).results;
        let response = await ahAPI.sendSPQuoteApproveRequest(ahAPI.COMMON_TOKEN, TestData.altServicePack.id, TestData.altSPQuote.id, TestData.spAltQuoteApproveDetails, TestData.altOrgId);
        expect(response.statusCode).toBe(200);
        await freshdeskHelper.wait_for_new_ticket("type:'Approved'", fd_tickets, 20, TestData.altSPQuote.quoteNo)
        let quote_request_email_detail=await gmailHelper.waitForNewMessage(TestData.spAltQuoteConfirmationMessageFilter)
        let quote_request_message= await gmailHelper.getPlainHTMLFromMessage(quote_request_email_detail,0)
        let email_body=quote_request_message.body.textContent
        expect(email_body).toMatch(new RegExp(`.*We have received your order for the quote.*${TestData.altSPQuote.quoteNo}.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Quote Number.*${TestData.altSPQuote.quoteNo}.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*PO Number.*${TestData.spAltQuoteApproveDetails.poNumber}.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Start Date.*${TestData.altSPQuote.startDate}.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Purchase Price.*CHF.*${TestData.spAltQuoteApproveDetails.sgPriceStr}.*`,"s"));
    }, 60000)

})