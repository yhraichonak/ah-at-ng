import ahAPI from "../../api/SupertestAHAPIHelper";
import TestData from "../testdata";
import gmailHelper from "../../api/GmailHelper";
import commonAPIHelper from "../../api/CommonAPIHelper";
import * as allure from "allure-js-commons";

let common_token
let register_email=TestData.defaultRegisterUserDetails.email;
let defaultMessageFilter = TestData.youAreInvitedMessageFilter

beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
afterEach(async () => {
    await ahAPI.clearCommonSession();
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
    await gmailHelper.authorize()
    await gmailHelper.readEmails(defaultMessageFilter)
    let role_details = await ahAPI.get_organization_role_details(ahAPI.COMMON_TOKEN, "Owner", TestData.defaultOrgId);
    const response = await ahAPI.invite(ahAPI.COMMON_TOKEN, register_email, role_details.id, TestData.defaultOrgId);
    expect(response.statusCode).toBe(201);
    let invite_email_detail=await gmailHelper.waitForNewMessage(defaultMessageFilter)
    let invite_email_html= await gmailHelper.getPlainHTMLFromMessage(invite_email_detail)
    const links = invite_email_html.getElementsByTagName('a');
    common_token =(await commonAPIHelper.send("GET",links[0].getAttribute("href"),"",{})).text.split("token=")[1].split("&")[0]
},30000)

afterAll(async () => {
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
})

describe('[jest] Users - Negative Register', () => {

    test.each([
        { payload:{"firstName" : "", "lastName" : "lname", "password":"12345678"},
                descr:"Empty firstName", error:"String must contain at least 1 character(s)" },
        { payload:{"firstName" : "fname", "lastName" : "", "password":"12345678"},
                descr:"Empty lastName",  error:"String must contain at least 1 character(s)" },
        { payload:{"firstName" : "fname", "lastName" : "lname", "password":""},
                descr:"Empty password",  error:"password: String must contain at least 8 character(s)" },
        { payload:{"firstName" : "fname", "lastName" : "lname", "password":"12"},
                descr:"Short password"  , error:"password: String must contain at least 8 character(s)" },
    ])("User try to register with incomplete info - $descr", async ({payload, descr, error}) => {
        payload['token']=common_token
        const response = await ahAPI.registerWithPayload(payload, TestData.defaultOrgId);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(error);
    })

    test("User register via invite email - Invalid token", async () => {
        let payload={"firstName" : "fname", "lastName" : "lname", "password":"12345678", "token":"blah"};
        const response = await ahAPI.registerWithPayload(payload, TestData.defaultOrgId);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch("Einladung nicht gefunden");
    },)

    test("User register via invite email - Invalid orgId", async () => {
        let payload={"firstName" : "fname", "lastName" : "lname", "password":"12345678", "token":common_token};
        const response = await ahAPI.registerWithPayload( payload, TestData.defaultOrgId);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch("Einladung nicht gefunden");
    },)

})
