import ahAPI from "../../api/SupertestAHAPIHelper";
import TestData from "../testdata";
import gmailHelper from "../../api/GmailHelper";
import commonAPIHelper from "../../api/CommonAPIHelper";
import commonHelper from "../../api/CommonHelper";
const { matchersWithOptions } = require('jest-json-schema');
const schema = require('../schema.json');
expect.extend(matchersWithOptions({schemas: [schema]}));

describe('[jest] Forgot password', () => {

    beforeAll(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        await gmailHelper.authorize()
    })

    afterAll(async () => {
        await gmailHelper.readEmails(TestData.resetPasswordMessageFilter)
    })

    test("Forgot password", async () => {
        let register_email="positive1_"+TestData.defaultRegisterUserDetails.email;
        let message="We have received a request to reset your password. Please click the button below to set a new password"
        await gmailHelper.readEmails(TestData.resetPasswordMessageFilter)
        const response = await ahAPI.forgotPassword(register_email);
        expect(response.statusCode).toBe(200);
        let reset_password_email = await gmailHelper.waitForNewMessage(TestData.resetPasswordMessageFilter)
        let reset_email_html= await gmailHelper.getPlainHTMLFromMessage(reset_password_email)
        expect(reset_email_html.body.textContent).toMatch(new RegExp(`${message}`,"s"));
    },20000)

    describe('[jest] Forgot password', () => {
         test("Forgot password - Reset", async () => {
            try {
                let register_email="positive2_"+TestData.defaultRegisterUserDetails.email;
                await gmailHelper.readEmails(TestData.resetPasswordMessageFilter)
                let response = await ahAPI.forgotPassword(register_email);
                expect(response.statusCode).toBe(200);
                let reset_password_email = await gmailHelper.waitForNewMessage(TestData.resetPasswordMessageFilter)
                let reset_email_html = await gmailHelper.getPlainHTMLFromMessage(reset_password_email)
                const links = reset_email_html.getElementsByTagName('a');
                let token = (await commonAPIHelper.send("GET", links[0].getAttribute("href"), "", {})).text.split("token=")[1].split("&")[0].split("\"")[0]
                response = await ahAPI.resetPassword(TestData.defaultPass, token)
                expect(response.statusCode).toBe(200);
            } catch (err) {
                throw new Error(err)
            } finally {
                await commonHelper.sleep(1000)
            }
        }, 60000)
    })
    test("Forgot password - Reset - Short Password", async () => {
        let register_email="short_"+TestData.defaultRegisterUserDetails.email;
        await gmailHelper.readEmails(TestData.resetPasswordMessageFilter)
        let response = await ahAPI.forgotPassword(register_email);
        expect(response.statusCode).toBe(200);
        let reset_password_email = await gmailHelper.waitForNewMessage(TestData.resetPasswordMessageFilter)
        let reset_email_html= await gmailHelper.getPlainHTMLFromMessage(reset_password_email)
        const links = reset_email_html.getElementsByTagName('a');
        let token=(await commonAPIHelper.send("GET",links[0].getAttribute("href"),"",{})).text.split("token=")[1].split("&")[0].split("\"")[0]
        response= await ahAPI.resetPassword("", token)
        expect([400,500]).toContain(response.statusCode);
    },60000)

    test("Forgot password - Reset - Twice", async () => {
        let register_email="twice_"+TestData.defaultRegisterUserDetails.email;
        await gmailHelper.readEmails(TestData.resetPasswordMessageFilter)
        let response = await ahAPI.forgotPassword(register_email);
        expect(response.statusCode).toBe(200);
        let reset_password_email = await gmailHelper.waitForNewMessage(TestData.resetPasswordMessageFilter)
        let reset_email_html= await gmailHelper.getPlainHTMLFromMessage(reset_password_email)
        const links = reset_email_html.getElementsByTagName('a');
        let token=(await commonAPIHelper.send("GET",links[0].getAttribute("href"),"",{})).text.split("token=")[1].split("&")[0].split("\"")[0]
        response= await ahAPI.resetPassword(TestData.defaultPass, token)
        expect(response.statusCode).toBe(200);
        response= await ahAPI.resetPassword(TestData.defaultPass, token)
        expect(response.statusCode).toBe(400);
    },60000)

    test("Forgot password - Reset - Invalid token", async () => {
        let response= await ahAPI.resetPassword(TestData.defaultPass, "blah")
        expect(response.statusCode).toBe(400);
    })
})
