import ahAPI from "../../api/SupertestAHAPIHelper";
import TestData from "../testdata";
import gmailHelper from "../../api/GmailHelper";
import * as allure from "allure-js-commons";
import {sleep} from "../../api/utils";
const { matchersWithOptions } = require('jest-json-schema');
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
afterEach(async () => {await ahAPI.clearCommonSession();})
let invite_email_detail,register_email,viewer_role_id
beforeEach(async () => {
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
    invite_email_detail=undefined
})

afterEach(async () => {
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

beforeAll(async () => {
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
    viewer_role_id=(await ahAPI.getOrganizationRole("Viewer",ahAPI.COMMON_TOKEN, TestData.defaultOrgId))['id']
    await gmailHelper.authorize()
    await ahAPI.updateTestOrganization({"locale": "en"});
},20000)

afterAll(async () => {
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
    await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
})

describe('[jest] Users - Invite', () => {

    describe("Send User Invite",()=>{
        test.each([
            { lang:"en",subject:"You're invited: Your access to Tesedi's Asset Hub is ready.",
                header:"Your Invitation to Asset Hub", message: "Organizations you have been invited to:" },
            { lang:"de",subject:"Sie sind eingeladen: Ihr Zugang zum Asset Hub von Tesedi ist bereit.",
                header:"Ihre Einladung zu Asset Hub", message: "Organisationen, zu denen Sie eingeladen wurden:" },
            { lang:"fr",subject:"Vous êtes invité : votre accès à l’Asset Hub de Tesedi est prêt.",
                header:"Votre invitation à l’Asset Hub",message: "Organisations auxquelles vous avez été invité(e):" }
        ])
        ("Send user invite email - $lang", async ({lang, subject,header, message}) => {
            register_email=lang+"_"+TestData.defaultRegisterUserDetails.email;
            let messageFilter = `subject:${subject}. is:unread`
            await gmailHelper.readEmails(messageFilter)
            await ahAPI.updateTestOrganization({"locale": lang});
            let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, "Owner", TestData.defaultOrgId);
            const response = await ahAPI.invite(ahAPI.COMMON_TOKEN, register_email, role_details.id, TestData.defaultOrgId);
            expect(response.statusCode).toBe(201);
            invite_email_detail=await gmailHelper.waitForNewMessage(messageFilter)
            let invite_email_html= await gmailHelper.getPlainHTMLFromMessage(invite_email_detail)
            expect(invite_email_html.body.textContent).toMatch(new RegExp(header, "s"));
            expect(invite_email_html.body.textContent).toContain(`${message}${TestData.defaultOrganization}`);
        },30000)

        test.each([
            { lang:"it",subject:"Sei invitato: il tuo accesso all'Asset Hub di Tesedi è pronto.",
                header:"Il tuo invito ad Asset Hub", message: "Organizzazioni a cui sei stato invitato:" }
        ])
        ("{KNOWN ISSUE}: Send user invite email - $lang", async ({lang, subject,header, message}) => {
            let messageFilter = `subject:${subject}. is:unread`
            await allure.issue("AH-975")
            register_email=lang+"_"+TestData.defaultRegisterUserDetails.email;
            await gmailHelper.readEmails(messageFilter)
            await ahAPI.updateTestOrganization({"locale": lang});
            let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, "Owner", TestData.defaultOrgId);
            const response = await ahAPI.invite(ahAPI.COMMON_TOKEN, register_email, role_details.id, TestData.defaultOrgId);
            expect(response.statusCode).toBe(201);
            invite_email_detail=await gmailHelper.waitForNewMessage(messageFilter)
            let invite_email_html= await gmailHelper.getPlainHTMLFromMessage(invite_email_detail)
            expect(invite_email_html.body.textContent).toMatch(new RegExp(header, "s"));
            expect(invite_email_html.body.textContent).toContain(`${message}${TestData.defaultOrganization}`);
        },30000)

        test.each([
            { role:"Owner" },
            { role:"Approver" },
            { role:"Requester" },
            { role:"Support Operator" }
        ])("Send user invite email - $role", async ({role}) => {
            register_email=role.replaceAll(" ","_")+"_"+TestData.defaultRegisterUserDetails.email;
            await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
            let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, role, TestData.defaultOrgId);
            const response = await ahAPI.invite(ahAPI.COMMON_TOKEN, register_email, role_details.id, TestData.defaultOrgId);
            expect(response.statusCode).toBe(201);
            invite_email_detail = await gmailHelper.waitForNewMessage(TestData.youAreInvitedMessageFilter)
        },30000)

        test("Send user invite email - Super Admin", async () => {
            try {
                await gmailHelper.readEmails(TestData.youAreInvitedSAMessageFilter)
                let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_SA_TOKEN, "Super Admin", TestData.superOrgId);
                const response = await ahAPI.invite(ahAPI.COMMON_SA_TOKEN,  TestData.defaultRegisterSADetails.email, role_details.id, TestData.superOrgId);
                expect(response.statusCode).toBe(201);
                invite_email_detail = await gmailHelper.waitForNewMessage(TestData.youAreInvitedSAMessageFilter)
            }catch (e){throw new Error(e)}
            finally {
                let userdetails = await ahAPI.getUserDetails(TestData.defaultRegisterSADetails)
                if (userdetails !==undefined) {
                    if (userdetails["status"] == "invited") {
                        await ahAPI.removeInvitedUser(ahAPI.COMMON_SA_TOKEN, userdetails.id, TestData.defaultRegisterSADetails.orgId)
                    } else {
                        await ahAPI.unlinkUser(ahAPI.COMMON_SA_TOKEN, userdetails.id, userdetails.role.id, TestData.defaultRegisterSADetails.orgId);
                    }
                    await ahAPI.disableUser(ahAPI.COMMON_SA_TOKEN, userdetails.id, TestData.defaultRegisterSADetails.orgId);
                }
            }
        },30000)

        test("Send user invite email - invalid email", async () => {
            let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, "Owner", TestData.defaultOrgId);
            const response = await ahAPI.invite(ahAPI.COMMON_TOKEN, "blah", role_details.id, TestData.defaultOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toMatch(/email: Invalid email/);

        })

        test("Send user invite email - invalid role", async () => {
            register_email="invrole_"+TestData.defaultRegisterUserDetails.email;
            const response = await ahAPI.invite(ahAPI.COMMON_TOKEN, register_email, "dsfdfsd", TestData.defaultOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toMatch(/roleId: Invalid uuid/);
        })

        test("Send user invite email - non-existing roleId", async () => {
            const response = await ahAPI.invite(ahAPI.COMMON_TOKEN, 'nonexistingrole@tesedi.com', TestData.nonExisingId, TestData.defaultOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toMatch(/Role with.*not found/);
        })

        test("Send user invite email - invalid organization", async () => {
            register_email="invorg_"+TestData.defaultRegisterUserDetails.email
            let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, "Owner", TestData.defaultOrgId);
            const response = await ahAPI.invite(ahAPI.COMMON_TOKEN, register_email, role_details.id, TestData.nonExisingId);
            expect(response.statusCode).toBe(403);
        })

        test.each([
            { user:TestData.defaultViewerDetails, role:"Viewer" },
            { user:TestData.defaultApproverDetails, role:"Approver" },
            { user:TestData.defaultRequesterDetails, role:"Requester" }
        ])
        ("Send user invite email - unprivileged user - $role", async ({user, role}) => {
            register_email="unpriv_"+role+"_"+TestData.defaultRegisterUserDetails.email
            let TOKEN= await ahAPI.getUserToken(user);
            let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, "Owner", TestData.defaultOrgId);
            const response = await ahAPI.invite(TOKEN, register_email, role_details.id, TestData.defaultOrgId);
            expect(response.statusCode.toString()).toMatch(/401|403/)
        })

        test("Send user invite email - as Support Operator", async () => {
            register_email="operator_"+TestData.defaultRegisterUserDetails.email
            let TOKEN= await ahAPI.getUserToken(TestData.defaultOperatorDetails);
            let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, "Owner", TestData.defaultOrgId);
            const response = await ahAPI.invite(TOKEN, register_email, role_details.id, TestData.defaultOrgId);
            expect(response.statusCode).toBe(201)
        })

        test("Send user invite email - as Super Admin", async () => {
            register_email="sa_"+TestData.defaultRegisterUserDetails.email
            let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, "Owner", TestData.defaultOrgId);
            const response = await ahAPI.invite(ahAPI.COMMON_SA_TOKEN, register_email, role_details.id, TestData.defaultOrgId);
            expect(response.statusCode).toBe(201)
        })
    })

    describe("Re-Send User Invite",()=>{
        test("Re-send user invite email - Positive", async () => {
            try {
                register_email = "resend_" + TestData.defaultRegisterUserDetails.email
                await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
                let resp = await ahAPI.invite(ahAPI.COMMON_SA_TOKEN, register_email, viewer_role_id, TestData.defaultOrgId);
                invite_email_detail = await gmailHelper.waitForNewMessage(TestData.youAreInvitedMessageFilter)
                await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
            }
            catch (e){throw e;}
            //Implement hardcoded 2-minute sleep due to email sending limitation
            finally {await sleep(120)}
            let response = await ahAPI.resendInvite(ahAPI.COMMON_TOKEN, register_email, TestData.defaultOrgId);
            expect(response.statusCode).toBe(200);
            invite_email_detail = await gmailHelper.waitForNewMessage(TestData.youAreInvitedMessageFilter)
        },150000)

        test("Re-send user invite email - Non-registered email", async () => {
            let response = await ahAPI.resendInvite(ahAPI.COMMON_TOKEN, "blah@blah.com", TestData.defaultOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toMatch(/Einladung nicht gefunden/)
        })

        test("Re-send user invite email - Invalid Org", async () => {
            let response = await ahAPI.resendInvite(ahAPI.COMMON_TOKEN, register_email, TestData.nonExisingId);
            expect(response.statusCode).toBe(403);
        })
        test("Re-send user invite email -  Unauthorized", async () => {
            let response = await ahAPI.resendInvite("BLAH", register_email, TestData.defaultOrgId);
            expect(response.statusCode).toBe(401);
        })
        test("Re-send user invite email -  Unprivileged", async () => {
            let TOKEN= await ahAPI.getUserToken(TestData.defaultViewerDetails)
            let response = await ahAPI.resendInvite(TOKEN, register_email, TestData.defaultOrgId);
            expect(response.statusCode).toBe(403);
        })
    })

    describe("Remove User Invite",()=>{

        test("Remove Invite - Positive", async () => {
            register_email="reminvite_"+TestData.defaultRegisterUserDetails.email
            await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
            await ahAPI.invite(ahAPI.COMMON_SA_TOKEN, register_email, viewer_role_id, TestData.defaultOrgId);
            invite_email_detail = await gmailHelper.waitForNewMessage(TestData.youAreInvitedMessageFilter)
            await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
            let invitedUserDetails=await ahAPI.getUserDetails({"email":register_email,"orgId":TestData.defaultOrgId})
            let response = await ahAPI.removeInvitedUser(ahAPI.COMMON_TOKEN, invitedUserDetails.id, TestData.defaultOrgId, TestData.defaultOrgId);
            expect(response.statusCode).toBe(200);
        },30000)

        test("Remove Invite - Non-registered userId", async () => {
            register_email="nonreguser_"+TestData.defaultRegisterUserDetails.email
            await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
            await ahAPI.invite(ahAPI.COMMON_SA_TOKEN, register_email, viewer_role_id, TestData.defaultOrgId);
            invite_email_detail = await gmailHelper.waitForNewMessage(TestData.youAreInvitedMessageFilter)
            await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
            let response = await ahAPI.removeInvitedUser(ahAPI.COMMON_TOKEN, TestData.nonExisingId, TestData.defaultOrgId, TestData.defaultOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toMatch(/Einladung.*nicht gefunden/)
        },30000)

        test("Remove Invite Invalid Org", async () => {
            register_email="invorg_"+TestData.defaultRegisterUserDetails.email
            await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
            await ahAPI.invite(ahAPI.COMMON_SA_TOKEN, register_email, viewer_role_id, TestData.defaultOrgId);
            invite_email_detail = await gmailHelper.waitForNewMessage(TestData.youAreInvitedMessageFilter)
            await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
            let invitedUserDetails=await ahAPI.getUserDetails({"email":register_email,"orgId":TestData.defaultOrgId})
            let response = await ahAPI.removeInvitedUser(ahAPI.COMMON_TOKEN, invitedUserDetails.id, TestData.nonExisingId, TestData.defaultOrgId);
            expect(response.statusCode).toBe(400);
        },30000)

        test("Remove Invite -  Unauthorized", async () => {
            register_email="unauth_"+TestData.defaultRegisterUserDetails.email
            await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
            await ahAPI.invite(ahAPI.COMMON_SA_TOKEN, register_email, viewer_role_id, TestData.defaultOrgId);
            invite_email_detail = await gmailHelper.waitForNewMessage(TestData.youAreInvitedMessageFilter)
            await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
            let invitedUserDetails=await ahAPI.getUserDetails({"email":register_email,"orgId":TestData.defaultOrgId})
            let response = await ahAPI.removeInvitedUser("BLAH", invitedUserDetails.id, TestData.defaultOrgId, TestData.defaultOrgId);
            expect(response.statusCode).toBe(401);
        },30000)

        test("Remove Invite -  Unprivileged", async () => {
            register_email="unpriv_"+TestData.defaultRegisterUserDetails.email
            await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
            await ahAPI.invite(ahAPI.COMMON_SA_TOKEN, register_email, viewer_role_id, TestData.defaultOrgId);
            invite_email_detail = await gmailHelper.waitForNewMessage(TestData.youAreInvitedMessageFilter)
            await gmailHelper.readEmails(TestData.youAreInvitedMessageFilter)
            let TOKEN= await ahAPI.getUserToken(TestData.defaultViewerDetails)
            let invitedUserDetails=await ahAPI.getUserDetails({"email":register_email,"orgId":TestData.defaultOrgId})
            let response = await ahAPI.removeInvitedUser(TOKEN, invitedUserDetails.id, TestData.defaultOrgId, TestData.defaultOrgId);
            expect(response.statusCode).toBe(403);
        },30000)
    })
})
