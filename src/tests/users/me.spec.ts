import ahAPI from "../../api/SupertestAHAPIHelper";
import TestData from "../testdata";
import gmailHelper from "../../api/GmailHelper";
import commonHelper from "../../api/CommonHelper";
import * as allure from "allure-js-commons";
const { matchersWithOptions } = require('jest-json-schema');
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
afterEach(async () => {await ahAPI.clearCommonSession();})
beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
beforeAll(async () => {
    await gmailHelper.authorize()
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
    await ahAPI.postMe(ahAPI.COMMON_TOKEN,
      {  firstName:TestData.defaultUserDetails.fname,
          lastName:TestData.defaultUserDetails.lname,
          locale:"en",
          isActive: true })
})

afterAll(async () => {
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
    await ahAPI.postMe(ahAPI.COMMON_TOKEN,
        {  firstName:TestData.defaultUserDetails.fname,
            lastName:TestData.defaultUserDetails.lname,
            isActive: true })
})

describe('[jest] Users - Me', () => {

    test("Users - Me", async () => {
        const response = await ahAPI.me(ahAPI.COMMON_TOKEN, TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/user_details'})
    })

    test("Users - Me - User Details", async () => {
        const response = await ahAPI.me(ahAPI.COMMON_TOKEN, TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.isActive).toEqual(true);
        expect(response.body.email).toEqual(TestData.defaultUserDetails.email);
        expect(response.body.firstName).toEqual(TestData.defaultUserDetails.fname);
        expect(response.body.lastName).toEqual(TestData.defaultUserDetails.lname);
    })

    test("Users - Me - Unauthorized", async () => {
        const response = await ahAPI.me("blahblah", TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test.each([
        {payload: { "firstName": "Test", "lastName": "User",
                    "isActive": true,"phone": "+442012345678"}, "describe": "ALL parameters"},
        {payload: { "firstName": "Test_edited","lastName": "User_edited"},"describe": "Only names" }
    ])
    ("Users - Me - Post Details [$describe]", async ({payload, describe}) => {
        const response = await ahAPI.postMe(ahAPI.COMMON_TOKEN,payload);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(expect.objectContaining(payload));
    },10000)

    test.each([
        {payload: { "firstName": "firstName", "lastName": ""},
            msg: "lastName: String must contain at least 1 character(s)",
            describe: "Empty lastName" },
        {payload: { "lastName": "lastName", "firstName":"" },
            msg: "firstName: String must contain at least 1 character(s)",
            describe: "Empty firstName" },
    ])
    ("Users - Me - Post Empty Details  [$describe]", async ({payload, msg, describe}) => {
        let edit_user_token= (await ahAPI.getUserToken(TestData.defaultUserDetails));
        const response = await ahAPI.postMe(edit_user_token,payload);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(msg);
    })

    test.each([
        {payload: { "email": "blah"},msg: "Invalid email",describe: "Invalid email" },
        {payload: { "firstName": TestData.string257},
            msg: "firstName: String must contain at most 255 character",describe: "Prolonged firstName" },
        {payload: { "lastName": TestData.string257},
            msg: "lastName: String must contain at most 255 character",describe: "Prolonged lastName" }
    ])
    ("Users - Me - Post Invalid Details  [$describe]", async ({payload, msg, describe}) => {
        const response = await ahAPI.postMe(ahAPI.COMMON_TOKEN,payload);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(msg);
    })

    test.each([
        {"locale": "de"},
        {"locale": "fr"},
        {"locale": "it"},
        {"locale": "en"}
        ])
    ("Users - Me - Post Locale [$locale]", async ({locale}) => {
        let payload = {
            firstName:TestData.defaultUserDetails.fname,
            lastName:TestData.defaultUserDetails.lname,
            "locale": locale}
        const response = await ahAPI.postMe(ahAPI.COMMON_TOKEN, payload);
        expect(response.statusCode).toBe(200);
    },20000)

    test.each([
        {"locale": "de", "subject":"Passwort zurücksetzen"},
        {"locale": "fr", "subject":"Réinitialiser le mot de passe"},
        {"locale": "en", "subject":"Reset Password"}
    ])
    ("Users - Me - Post Locale [$locale] - Check emails", async ({locale,subject}) => {
        let payload = {firstName:TestData.defaultUserDetails.fname, lastName:TestData.defaultUserDetails.lname, "locale": locale}
        let response = await ahAPI.postMe(ahAPI.COMMON_TOKEN, payload);
        expect(response.statusCode).toBe(200);
        await gmailHelper.readEmails(`${subject}. is:unread`)
        await commonHelper.sleep(2)
        response = await ahAPI.forgotPassword(TestData.defaultEditUserDetails.email);
        expect(response.statusCode).toBe(200);
        let reset_password_email = await gmailHelper.waitForNewMessage(subject)
        let reset_email_html= await gmailHelper.getPlainHTMLFromMessage(reset_password_email)
        console.log(reset_email_html);
    },20000)

    test.each([
        {"locale": "it", "subject":"Reimpostazione della password"},
    ])
    ("{KNOWN ISSUE}: Users - Me - Post Locale [$locale] - Check emails", async ({locale,subject}) => {
        await allure.issue("AH-975")
        let payload = {firstName:TestData.defaultUserDetails.fname, lastName:TestData.defaultUserDetails.lname, "locale": locale}
        let response = await ahAPI.postMe(ahAPI.COMMON_TOKEN, payload);
        expect(response.statusCode).toBe(200);
        await gmailHelper.readEmails(`${subject}. is:unread`)
        await commonHelper.sleep(2)
        response = await ahAPI.forgotPassword(TestData.defaultEditUserDetails.email);
        expect(response.statusCode).toBe(200);
        let reset_password_email = await gmailHelper.waitForNewMessage(subject)
        let reset_email_html= await gmailHelper.getPlainHTMLFromMessage(reset_password_email)
        console.log(reset_email_html);
    },20000)

    test("Users - Me - Post Invalid Locale", async () => {
        let payload = {
            firstName:TestData.defaultUserDetails.fname,
            lastName:TestData.defaultUserDetails.lname,
            locale: "WWW"
        }
        await allure.issue("AH-1067")
        const response = await ahAPI.postMe(ahAPI.COMMON_TOKEN,payload);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(/locale: Invalid enum value. Expected 'fr' | 'de' | 'en' | 'it', received 'WWW'/);
    })

    test("Users - Me - Post Details Unauthorized", async () => {
        const response = await ahAPI.postMe("blah",TestData.testUserDetails);
        expect(response.statusCode).toBe(401);
    })


    test("Users - Me - Change Password", async () => {
        let pass= TestData.defaultPass;
        let newPass=`${TestData.defaultPass}9`;
        let payload = {"currentPassword":pass,"newPassword":newPass,"confirmPassword":newPass}
        let reversePayload = {"currentPassword":newPass,"newPassword":pass,"confirmPassword":pass}
        let newToken
        try {
            let TOKEN = await ahAPI.getUserToken(TestData.defaultEditUserDetails)
            let response = await ahAPI.postMePassword(TOKEN, payload);
            expect(response.statusCode).toBe(200);
            response = await ahAPI.authenticateUser({"email": TestData.defaultEditUserDetails.email, "password": newPass})
            expect(response.statusCode).toBe(200);
            newToken=response.body.token;
        }
        catch (e){throw e;} finally {
            if (newToken !==undefined) {await ahAPI.postMePassword(newToken, reversePayload);}
        }
    })

    test.each([
        {payload: {"currentPassword":"blah","newPassword":TestData.defaultPass,"confirmPassword":TestData.defaultPass},
            message: "Ungültiges aktuelles Passwort", descr:"Invalid current password"},
        {payload:{"currentPassword":TestData.defaultPass,"newPassword":TestData.defaultPass+"1","confirmPassword":TestData.defaultPass},
            message: "passwordConfirm: SECURITY.PASSWORDS_DO_NOT_MATCH", descr:"Non-matching password and confirmation"},
        {payload: {"currentPassword":TestData.defaultPass,"newPassword":"","confirmPassword":TestData.defaultPass},
            message: "newPassword: String must contain at least 8 character",descr:"Empty new password"},
        {payload: {"currentPassword":TestData.defaultPass,"newPassword":TestData.defaultPass,"confirmPassword":""},
            message: "confirmPassword: String must contain at least 8 character",descr:"Empty new password confirmation"},
        {payload: {"currentPassword":TestData.defaultPass,"newPassword":"12","confirmPassword":"12"},
            message: "newPassword: String must contain at least 8 character",descr:"Too short new password and confirmation"},
    ])
    ("Users - Me - Change Password - $descr", async ({payload,message}) => {
        let TOKEN = await ahAPI.getUserToken(TestData.defaultEditUserDetails)
        let response = await ahAPI.postMePassword(TOKEN, payload);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(new RegExp(message))
    })

    test("Users - Me - Change Password - Unauthorized", async () => {
        let payload = {"currentPassword":"pass","newPassword":"pass","confirmPassword":"pass"}
            let response = await ahAPI.postMePassword("blah", payload);
        expect(response.statusCode).toBe(401);
    })

    test("Users - Me - Permission", async () => {
        const response = await ahAPI.mePermissions(ahAPI.COMMON_TOKEN, TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/user_permissions'})
    })
    test("Users - Me - Permission - Values", async () => {
        const response = await ahAPI.mePermissions(ahAPI.COMMON_TOKEN, TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(TestData.appliedRolesPermissions["Owner"]);
    })
    test("Users - Me - Permission - Unauthorized", async () => {
        const response = await ahAPI.mePermissions("blah", TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })
    test("Users - Me - Roles", async () => {
        const response = await ahAPI.meRoles(ahAPI.COMMON_TOKEN, TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body[0].roles).toMatchSchema( {$ref: 'schema#/definitions/user_role'})
    })
    test("Users - Me - Roles - Values", async () => {
        const response = await ahAPI.meRoles(ahAPI.COMMON_TOKEN, TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.find(t=>t.roles.name=="Owner").roles.description).toEqual("The owner role enables the reseller to self manage user accounts for his organisation.");
    })
    test("Users - Me - Roles - Unauthorized", async () => {
        const response = await ahAPI.meRoles('blah', TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })
})
