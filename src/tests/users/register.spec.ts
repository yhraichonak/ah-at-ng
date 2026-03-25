import ahAPI from "../../api/SupertestAHAPIHelper";
import TestData from "../testdata";
import gmailHelper from "../../api/GmailHelper";
import commonAPIHelper from "../../api/CommonAPIHelper";
import ahDBHelper from "../../api/AHDBHelper";
const { matchersWithOptions } = require('jest-json-schema');
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
afterEach(async () => {await ahAPI.clearCommonSession();})
let register_email
beforeEach(async () => {
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
})

afterEach(async () => {
    await ahAPI.updateTestOrganization({"locale": "en"});
     if (register_email!==undefined) {
         await ahDBHelper.removeUserByEmail(register_email)
     }
})

beforeAll(async () => {
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
    await gmailHelper.authorize()
    await ahAPI.updateTestOrganization({"locale": "en"});
})

afterAll(async () => {
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
})

describe('[jest] Users - Register', () => {
    register_email=TestData.defaultRegisterAltUserDetails.email;
    let defaultMessageFilter = TestData.youAreInvitedMessageFilter


    test("User register via invite email", async () => {
        register_email="register_"+TestData.defaultRegisterAltUserDetails.email;
        await gmailHelper.readEmails(defaultMessageFilter)
        let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, "Owner", TestData.defaultOrgId);
        const response = await ahAPI.invite(ahAPI.COMMON_TOKEN, register_email, role_details.id, TestData.defaultOrgId);
        expect(response.statusCode).toBe(201);
        let invite_email_detail=await gmailHelper.waitForNewMessage(defaultMessageFilter)
        let invite_email_html= await gmailHelper.getPlainHTMLFromMessage(invite_email_detail)
        const links = invite_email_html.getElementsByTagName('a');
        let token=(await commonAPIHelper.send("GET",links[0].getAttribute("href"),"",{})).text.split("token=")[1].split("&")[0]
        let resp= await ahAPI.registerAsUser(TestData.defaultRegisterAltUserDetails, token)
        expect(resp.statusCode).toBe(200);
        expect(resp.body.success).toBe(true);
        expect(resp.body.email).toBe(register_email);
        expect(resp.body.token).not.toBe(null);
    },30000)

    test("User register via invite email - Outdated email", async () => {
        register_email="outdated_"+TestData.defaultRegisterAltUserDetails.email;
        await gmailHelper.readEmails(defaultMessageFilter)
        let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, "Owner", TestData.defaultOrgId);
        const response = await ahAPI.invite(ahAPI.COMMON_TOKEN, register_email, role_details.id, TestData.defaultOrgId);
        expect(response.statusCode).toBe(201);
        let invite_email_detail=await gmailHelper.waitForNewMessage(defaultMessageFilter)
        let invite_email_html= await gmailHelper.getPlainHTMLFromMessage(invite_email_detail)
        const links = invite_email_html.getElementsByTagName('a');
        let token=(await commonAPIHelper.send("GET",links[0].getAttribute("href"),"",{})).text.split("token=")[1].split("&")[0]
        await ahAPI.resendInvite(ahAPI.COMMON_TOKEN, register_email, TestData.defaultOrgId);
        let resp= await ahAPI.registerAsUser(TestData.defaultRegisterAltUserDetails, token)
        expect(resp.statusCode).toBe(400);
        expect(resp.body.message).toMatch(/Einladung nicht gefunden/);

    },30000)

    test("User register via invite email - Deleted Invitation", async () => {
        register_email="deleted_"+TestData.defaultRegisterAltUserDetails.email;
        await gmailHelper.readEmails(defaultMessageFilter)
        let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, "Owner", TestData.defaultOrgId);
        const response = await ahAPI.invite(ahAPI.COMMON_TOKEN, register_email, role_details.id, TestData.defaultOrgId);
        expect(response.statusCode).toBe(201);
        let invite_email_detail=await gmailHelper.waitForNewMessage(defaultMessageFilter)
        let invite_email_html= await gmailHelper.getPlainHTMLFromMessage(invite_email_detail)
        const links = invite_email_html.getElementsByTagName('a');
        let token=(await commonAPIHelper.send("GET",links[0].getAttribute("href"),"",{})).text.split("token=")[1].split("&")[0]
        let invitedUserDetails=await ahAPI.getUserDetails({"email":register_email,"orgId":TestData.defaultOrgId})
        await ahAPI.removeInvitedUser(ahAPI.COMMON_TOKEN, invitedUserDetails.id, TestData.defaultOrgId, TestData.defaultOrgId);
        let resp= await ahAPI.registerAsUser(TestData.defaultRegisterAltUserDetails, token)
        expect(resp.statusCode).toBe(400);
        expect(resp.body.message).toMatch(/Einladung nicht gefunden/);
    },30000)

    test("User register via invite email - Resent invite", async () => {
        register_email="resendreg_"+TestData.defaultRegisterAltUserDetails.email;
        await gmailHelper.readEmails(defaultMessageFilter)
        let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, "Owner", TestData.defaultOrgId);
        const response = await ahAPI.invite(ahAPI.COMMON_TOKEN, register_email, role_details.id, TestData.defaultOrgId);
        expect(response.statusCode).toBe(201);
        await gmailHelper.waitForNewMessage(defaultMessageFilter)
        await gmailHelper.readEmails(defaultMessageFilter)
        await ahAPI.resendInvite(ahAPI.COMMON_TOKEN, register_email, TestData.defaultOrgId);
        let invite_email_detail=await gmailHelper.waitForNewMessage(defaultMessageFilter)
        let invite_email_html= await gmailHelper.getPlainHTMLFromMessage(invite_email_detail)
        const links = invite_email_html.getElementsByTagName('a');
        let token=(await commonAPIHelper.send("GET",links[0].getAttribute("href"),"",{})).text.split("token=")[1].split("&")[0]
        let resp= await ahAPI.registerAsUser(TestData.defaultRegisterAltUserDetails, token)
        expect(resp.statusCode).toBe(200);
        expect(resp.body.success).toBe(true);
    },30000)

    test("User register via invite email - Twice", async () => {
        register_email="twicereg_"+TestData.defaultRegisterAltUserDetails.email;
        await gmailHelper.readEmails(defaultMessageFilter)
        let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, "Owner", TestData.defaultOrgId);
        const response = await ahAPI.invite(ahAPI.COMMON_TOKEN, register_email, role_details.id, TestData.defaultOrgId);
        expect(response.statusCode).toBe(201);
        let  invite_email_detail = await gmailHelper.waitForNewMessage(defaultMessageFilter)
        let invite_email_html= await gmailHelper.getPlainHTMLFromMessage(invite_email_detail)
        const links = invite_email_html.getElementsByTagName('a');
        let token=(await commonAPIHelper.send("GET",links[0].getAttribute("href"),"",{})).text.split("token=")[1].split("&")[0]
        let resp= await ahAPI.registerAsUser(TestData.defaultRegisterAltUserDetails, token)
        resp= await ahAPI.registerAsUser(TestData.defaultRegisterAltUserDetails, token)
        expect(resp.statusCode).toBe(400);
        expect(resp.body.message).toMatch(/Invitation already used|Einladung nicht gefunden/);
    },30000)
})
