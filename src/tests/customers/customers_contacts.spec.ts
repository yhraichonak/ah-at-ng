import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import {test} from "@jest/globals";
import ahDBHelper from "../../api/AHDBHelper";
import * as allure from "allure-js-commons";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
describe('[jest] Customer Contacts', () => {

    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {})
    let testCustomerId=TestData.defaultEndUserDetails.id;
    test("Get Contacts", async () => {
        let response =await ahAPI.getCustomerItems(ahAPI.COMMON_TOKEN,testCustomerId, "contacts",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/contacts_summaries'})
    })

    test("Get Contacts - Details", async () => {
        let contact=TestData.defaultDistributorContact
        let response =await ahAPI.getCustomerItems(ahAPI.COMMON_TOKEN,testCustomerId, "contacts",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        let target_entity=response.body.data.find(n=>n.emailAddress==contact['emailAddress']);
        expect(target_entity.givenName).toEqual(contact["givenName"]);
        expect(target_entity.surname).toEqual(contact["surname"]);
        expect(target_entity.businessPhone).toEqual(contact["businessPhone"]);
        expect(target_entity.active).toEqual(contact["active"]);
    })

    test("Get Contacts - No contacts", async () => {
        let response =await ahAPI.getCustomerItems(ahAPI.COMMON_TOKEN,TestData.resellerWithoutContacts, "contacts",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBe(0)
    })

    test("Customer - Get Contacts - Unauthorized", async () => {
        let response =await ahAPI.getCustomerItems("blah",testCustomerId, "contacts",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Get Contacts - wrong orgId", async () => {
        let response =await ahAPI.getCustomerItems(ahAPI.COMMON_TOKEN,testCustomerId, "contacts",TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    })

    test("Get Contacts - wrong entityId", async () => {
        let response =await ahAPI.getCustomerItems(ahAPI.COMMON_TOKEN,"", "contacts",TestData.defaultOrgId);
        expect(response.statusCode).toBe(404);
    })

    let contactPayload={"firstName":"Fname","lastName":"Lname","email":"email@email.com","businessPhone":"+375233432349"}

    test("Customers Contacts - Create", async () => {
        let response
        try {
            response =await ahAPI.createCustomerContact(ahAPI.COMMON_TOKEN,testCustomerId,contactPayload,TestData.defaultOrgId);
            expect(response.statusCode).toBe(201);
            expect(response.body.givenName).toEqual(contactPayload.firstName);
            expect(response.body.surname).toEqual(contactPayload.lastName);
            expect(response.body.emailAddress).toEqual(contactPayload.email);
            expect(response.body.businessPhone).toEqual(contactPayload.businessPhone);
        }catch (err){throw err}
        finally {if (response!==undefined)   await ahDBHelper.removeContact(response.body.id)}
    })


    test.each([
        {attr: "firstName"},
        {attr: "lastName"},
        {attr: "email"},
        {attr: "businessPhone"},
    ])
    ("Customers - Create Contact - Empty - $attr", async ({attr}) => {
        let response
        try {
            let payload=structuredClone(contactPayload);
            payload[attr]=""
            response = await ahAPI.createCustomerContact(ahAPI.COMMON_TOKEN,testCustomerId, payload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toMatch(new RegExp(`${attr}: String must contain at least 1 `));
        }catch (err){throw err}
        finally {if (response.body?.id!==undefined)   await ahDBHelper.removeContact(response.body.id)}
    })

    test.each([
        {attr: "email", message:"Invalid email"},
        {attr: "businessPhone", message:"Invalid phone number"},
    ])
    ("Customers - Create Contact - $message", async ({attr,message}) => {
        let response
        try {
            let payload=structuredClone(contactPayload);
            payload[attr]="blah"
            response = await ahAPI.createCustomerContact(ahAPI.COMMON_TOKEN,testCustomerId, payload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toMatch(new RegExp(message));
        }catch (err){throw err}
        finally {if (response.body?.id!==undefined)   await ahDBHelper.removeContact(response.body.id)}
    })

    test("Customers Contacts - Create Contact - Unauthorized", async () => {
        let response =await ahAPI.createCustomerContact("BLAH",testCustomerId,contactPayload,TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })
    test("Customers Contacts- Create Contact - Unprivileged", async () => {
        let TOKEN=await ahAPI.getUserToken(TestData.restrictedUserDetails)
        let response =await ahAPI.createCustomerContact(TOKEN,testCustomerId,contactPayload,TestData.defaultOrgId);
        expect(response.statusCode).toBe(403);
    })

    test("Customers Contacts- Create Contact - Unknown orgId", async () => {
        let TOKEN=await ahAPI.getUserToken(TestData.restrictedUserDetails)
        let response =await ahAPI.createCustomerContact(TOKEN,testCustomerId,contactPayload,TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    })
})

