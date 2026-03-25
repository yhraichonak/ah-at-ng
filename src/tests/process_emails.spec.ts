import ahAPI from "../api/SupertestAHAPIHelper";
import TestData from "./testdata";
import ahDbHelper from "../api/AHDBHelper";
import gmailHelper from "../api/GmailHelper";
import commonAPIHelper from "../api/CommonAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));

afterEach(async () => {await ahAPI.clearCommonSession();})
beforeAll(async () => {await ahAPI.getCommonSessionForSA()})
beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
describe('[jest] Process Email Queue', () => {

    test("Trigger emails processing", async () => {
        const response = await ahAPI.processEmailQueue( ahAPI.COMMON_SA_TOKEN, TestData.superOrgId);
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toMatch(/Email queue processing has been triggered/);
    })

    test("Pending email", async () => {
        await gmailHelper.authorize()
        let register_email="positive1_"+TestData.defaultRegisterUserDetails.email;
        await gmailHelper.readEmails(TestData.resetPasswordMessageFilter)
        let response = await ahAPI.forgotPassword(register_email);
        expect(response.statusCode).toBe(200);
        let reset_password_email = await gmailHelper.waitForNewMessage(TestData.resetPasswordMessageFilter)
        let reset_email_html = await gmailHelper.getPlainHTMLFromMessage(reset_password_email)
        const links = reset_email_html.getElementsByTagName('a');
        let token = (await commonAPIHelper.send("GET", links[0].getAttribute("href"), "", {})).text.split("token=")[1].split("&")[0].split("\"")[0]
        await  ahDbHelper.set_email_queue_item_status(token, "QUEUED")
        await gmailHelper.readEmails(TestData.resetPasswordMessageFilter)
        response = await ahAPI.processEmailQueue( ahAPI.COMMON_SA_TOKEN, TestData.superOrgId);
        expect(response.statusCode).toBe(201);
        await gmailHelper.waitForNewMessage(TestData.resetPasswordMessageFilter)
        let result= await  ahDbHelper.get_email_queue_item_status(token)
        expect(result.status).toBe("SENT");
    },30000)

    test("Failed email", async () => {
        await gmailHelper.authorize()
        let register_email="positive1_"+TestData.defaultRegisterUserDetails.email;
        await gmailHelper.readEmails(TestData.resetPasswordMessageFilter)
        let response = await ahAPI.forgotPassword(register_email);
        expect(response.statusCode).toBe(200);
        let reset_password_email = await gmailHelper.waitForNewMessage(TestData.resetPasswordMessageFilter)
        let reset_email_html = await gmailHelper.getPlainHTMLFromMessage(reset_password_email)
        const links = reset_email_html.getElementsByTagName('a');
        let token = (await commonAPIHelper.send("GET", links[0].getAttribute("href"), "", {})).text.split("token=")[1].split("&")[0].split("\"")[0]
        await  ahDbHelper.set_email_queue_item_status(token, "FAILED")
        await gmailHelper.readEmails(TestData.resetPasswordMessageFilter)
        response = await ahAPI.processEmailQueue( ahAPI.COMMON_SA_TOKEN, TestData.superOrgId);
        expect(response.statusCode).toBe(201);
        let newmessage=undefined
        try {
            newmessage=await gmailHelper.waitForNewMessage(TestData.resetPasswordMessageFilter,10)
        }catch (e) {}
        finally {
            if (newmessage != undefined){
                throw new Error("Unexpected email was received");
            }
        }
        let result= await  ahDbHelper.get_email_queue_item_status(token)
        expect(result.status).toBe("FAILED");
    },30000)


    test("Unauthorized", async () => {
        let response = await ahAPI.processEmailQueue( "BLAH", TestData.superOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Unprivileged", async () => {
        let VIEWER_TOKEN= await ahAPI.getUserToken(TestData.defaultViewerUser);
        let response = await ahAPI.processEmailQueue( VIEWER_TOKEN, TestData.superOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Unknown orgId", async () => {
        let response = await ahAPI.processEmailQueue( ahAPI.COMMON_SA_TOKEN, TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    })

})