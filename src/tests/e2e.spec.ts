import ahAPI from "../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "./testdata";
import gmailHelper from "../api/GmailHelper";
import commonAPIHelper from "../api/CommonAPIHelper";
import freshdeskHelper from "../api/FreshdeskHelper";
import {expect} from "@jest/globals";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testOrgId=TestData.defaultOrgId
let invite_email_detail;
let register_email=TestData.defaultE2EUserDetails.email

describe('[jest] End to end scenarios', () => {
    afterEach(async () => {
        await ahAPI.updateTestOrganization({"locale": "en"});
        if (invite_email_detail!==undefined) await gmailHelper.markMessageAsRead(invite_email_detail.id);
        let userdetails = await ahAPI.getUserDetails(TestData.defaultE2EUserDetails)
        if (userdetails !==undefined) {
            if (userdetails["status"] == "invited") {
                await ahAPI.removeInvitedUser(ahAPI.COMMON_SA_TOKEN, userdetails.id, TestData.defaultE2EUserDetails.orgId)
            } else {
                await ahAPI.unlinkUser(ahAPI.COMMON_SA_TOKEN, userdetails.id, userdetails.role.id, TestData.defaultE2EUserDetails.orgId);
            }
            await ahAPI.disableUser(ahAPI.COMMON_SA_TOKEN, userdetails.id, TestData.defaultE2EUserDetails.orgId);
        }
    })

    beforeEach(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        invite_email_detail=undefined
    })

    beforeAll(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        await gmailHelper.authorize()
        await ahAPI.updateTestOrganization({"locale": "en"});
    })

    afterAll(async () => {
        await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
        await gmailHelper.readEmails(TestData.quoteRequestMessageFilter)
    })

    test("Invite - Register - Quote Request", async () => {
        await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
        await gmailHelper.readEmails(TestData.quoteRequestMessageFilter)
        let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, "Owner", TestData.defaultOrgId);
        const response = await ahAPI.invite(ahAPI.COMMON_TOKEN, register_email, role_details.id, TestData.defaultOrgId);
        expect(response.statusCode).toBe(201);
        invite_email_detail=await gmailHelper.waitForNewMessage(TestData.youAreInvitedMessageFilter)
        let invite_email_html= await gmailHelper.getPlainHTMLFromMessage(invite_email_detail)
        const links = invite_email_html.getElementsByTagName('a');
        let token=(await commonAPIHelper.send("GET",links[0].getAttribute("href"),"",{})).text.split("token=")[1].split("&")[0]
        let resp= await ahAPI.registerAsUser(TestData.defaultE2EUserDetails, token)
        expect(resp.statusCode).toBe(200);
        expect(resp.body.success).toBe(true);
        expect(resp.body.email).toBe(TestData.defaultE2EUserDetails.email);
        let NEW_USER_TOKEN=resp.body.token
        let new_item_id
        try {
            let fd_tickets = (await freshdeskHelper.search_recent_ticket("type:'New Business'")).results;
            let response = await ahAPI.sendQuotesRequestMultipart(NEW_USER_TOKEN, testOrgId, TestData.defaultQuotesRequestExistingCustomer);
            expect(response.statusCode).toBe(200);
            new_item_id = await freshdeskHelper.wait_for_new_ticket("type:'New Business'", fd_tickets)
            let fd_ticket_details = await freshdeskHelper.get_ticket_details(new_item_id);
            expect(fd_ticket_details.description_text).toMatch(/.*The following assets have been requested for quoting.*/s);
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*${ TestData.defaultEndUserDetails.name}.*`,"s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*SN001.*SKU001.*HPE Foundation Care CTR Service.*H7J36AC.*29\/08\/2026.*`,"s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*SN002.*SKU002.*HPE Foundation Care CTR Service.*H7J36AC.*29\/08\/2026 .*`,"s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Comment.*${TestData.defaultQuotesRequestExistingCustomer.message}.*`,"s"));

            let quote_request_email_detail=await gmailHelper.waitForNewMessage(TestData.quoteRequestMessageFilter)
            let quote_request_message= await gmailHelper.getPlainHTMLFromMessage(quote_request_email_detail,0)
            let email_body=quote_request_message.body.textContent
            expect(email_body).toMatch(/.*Quote Request Confirmation*/s);
            expect(email_body).toMatch(/.*Your Request:*/s);
            expect(email_body).toMatch(new RegExp(`.*End Customer.*${ TestData.defaultEndUserDetails.name}.*`,"s"));
            expect(email_body).toMatch(new RegExp(`.*SN001.*SKU001.*H7J36AC.*29.08.2026.*`,"s"));
            expect(email_body).toMatch(new RegExp(`.*SN002.*SKU002.*H7J36AC.*29.08.2026.*`,"s"));
            expect(email_body).toMatch(new RegExp(`.*Message.*${TestData.defaultQuotesRequestExistingCustomer.message}.*`,"s"));
        }
        catch (e){throw e;} finally {if (new_item_id!==undefined) {await freshdeskHelper.delete_ticket(new_item_id);}}

    },120000)
})

