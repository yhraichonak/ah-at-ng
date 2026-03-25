import {expect} from '@playwright/test';
import { test } from '../uifixtures/resource.fixture';
import TestData from "../tests/testdata";
import gmailHelper from "../api/GmailHelper";
import ahAPI from "../api/SupertestAHAPIHelper";
import {SignUpPage} from "../uipom/signup_page";
import {LoginPage} from "../uipom/login_page";
import freshdeskHelper from "../api/FreshdeskHelper";
import commonHelper from "../api/CommonHelper";
import fs from "fs";
import {QuotesListPage} from "../uipom/quotes_list_page";
let invite_email_detail
let register_email=TestData.defaultRegisterUserDetails.email;
let defaultMessageFilter = TestData.youAreInvitedMessageFilter
test.setTimeout(100000)
test.beforeAll(async ({}) => {
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
    await gmailHelper.authorize()
    await ahAPI.updateTestOrganization({"locale": "en"});
})
test.beforeEach(async () => {
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
    invite_email_detail=undefined
});

test.afterEach(async ({}) => {
    await ahAPI.updateTestOrganization({"locale": "en"});
    if (invite_email_detail!==undefined) await gmailHelper.markMessageAsRead(invite_email_detail.id);
    let userdetails = await ahAPI.getUserDetails(TestData.defaultRegisterUserDetails)
    if (userdetails !==undefined) {
        if (userdetails["status"] == "invited") {
            await ahAPI.removeInvitedUser(ahAPI.COMMON_SA_TOKEN, userdetails.id, TestData.defaultRegisterUserDetails.orgId)
        } else {
            await ahAPI.unlinkUser(ahAPI.COMMON_SA_TOKEN, userdetails.id, userdetails.role.id, TestData.defaultRegisterUserDetails.orgId);
        }
        await ahAPI.disableUser(ahAPI.COMMON_SA_TOKEN, userdetails.id, TestData.defaultRegisterUserDetails.orgId);
    }
})

test.afterAll(async ({})=> {
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
})

test(`Invited user can register and request quote`, async ({commonPage}) => {
    let page_inst=commonPage.page
    let fname="Fname"
    let lname="Lname"
    await gmailHelper.readEmails(defaultMessageFilter)
    let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, "Owner", TestData.defaultOrgId);
    const response = await ahAPI.invite(ahAPI.COMMON_TOKEN, register_email, role_details.id, TestData.defaultOrgId);
    expect(response.statusCode).toBe(201);
    invite_email_detail=await gmailHelper.waitForNewMessage(defaultMessageFilter)
    let invite_email_html= await gmailHelper.getPlainHTMLFromMessage(invite_email_detail)
    const links = invite_email_html.getElementsByTagName('a');
    await commonPage.go_to(links[0].getAttribute("href"), {waitUntil:"commit"})
    await (new SignUpPage(page_inst)).doRegister(fname,lname,TestData.defaultUserDetails.pass)
    await new LoginPage(page_inst).doLoginAs(register_email,TestData.defaultUserDetails.pass)
    expect(await (await commonPage.expandUserMenu()).textContent()).toMatch(new RegExp(`${fname} ${lname}.*${register_email}`,"s"))
    let qlp=await new QuotesListPage(page_inst)
    await qlp.navigate()
    let fd_ticket=(await freshdeskHelper.search_recent_ticket("type:'New Business'")).results;
    let quoteRequestDialog=await qlp.openQuoteRequestForm();
    await quoteRequestDialog.fillQuoteDetails(TestData.testQuoteRequest)
    await quoteRequestDialog.clickButton("Submit")
    await qlp.waitForNotification("Your quote has been requested successfully");
    let new_item_id=await freshdeskHelper.wait_for_new_ticket("type:'New Business'",fd_ticket)
    let fd_ticket_details= await freshdeskHelper.get_ticket_details( new_item_id);
    expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*End Customer.*${TestData.defaultEndUserDetails.name}.*`,'s'));
    expect(fd_ticket_details.description_text).toMatch(/.*11111.*2222.*HPE Foundation Care 24x7 Service.*H7J34AC.*/s);
    expect(fd_ticket_details.description_text).toMatch(/.*33333.*4444.*HPE Foundation Care 24x7 Service.*H7J34AC.*/s);
    expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Comment.*Test.*message.*`,'s'));
    let details=fd_ticket_details["attachments"][0]
    await commonHelper.downloadFile(details["attachment_url"],details["name"])
    expect(await fs.readFileSync(details["name"]).toString()==await fs.readFileSync("src/tests/poFile.pdf").toString(),`Files ${details["name"]} and "src/tests/poFile.pdf" are not the same`).toBe(true)
    await freshdeskHelper.delete_ticket( new_item_id);
});
