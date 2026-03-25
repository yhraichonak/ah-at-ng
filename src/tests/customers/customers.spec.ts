import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import ahDBHelper from "../../api/AHDBHelper";
import {test} from "@jest/globals";
import * as allure from "allure-js-commons";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
describe('[jest] Customers', () => {

    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})

    test("Get Customers", async () => {
            let response =await ahAPI.getCustomers(ahAPI.COMMON_TOKEN,TestData.defaultOrgId);
            expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/customers'})
    })

    test("Get Customers - Details", async () => {
        let response =await ahAPI.getCustomers(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,"?search="+TestData.defaultEndUserDetails["name"]);
        expect(response.statusCode).toBe(200);
        let target_entity=response.body.data.find(n=>n.id==TestData.defaultEndUserDetails["id"]);
        expect(target_entity.id).toEqual(TestData.defaultEndUserDetails["id"]);
        expect(target_entity.name).toEqual(TestData.defaultEndUserDetails["name"]);
        expect(target_entity.type).toEqual(TestData.defaultEndUserDetails["type"]);
    })

    test("Get Customers - Unauthorized", async () => {
        let response =await ahAPI.getCustomers("blah",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Get Customers - Invalid orgId", async () => {
        let response =await ahAPI.getCustomers(ahAPI.COMMON_TOKEN,"blah");
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(/Ungültiges Format der Organisations‑ID –/)
    })

    test("Get Customers - Pagination - Default", async () => {
        let response =await ahAPI.getCustomers(ahAPI.COMMON_TOKEN,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(50)
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    })

    test("Get Customers - Pagination - 100 item per page", async () => {
        let response =await ahAPI.getCustomersWithParams(ahAPI.COMMON_TOKEN,"30","","",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(30)
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    })

    test("Get Customers - Pagination - Cursor", async () => {
        let entities20 =(await ahAPI.getCustomersWithParams(ahAPI.COMMON_TOKEN,"20","","",TestData.defaultOrgId)).body.data;
        let response=await ahAPI.getCustomersWithParams(ahAPI.COMMON_TOKEN,"10","","",TestData.defaultOrgId);
        let nextCursor=response.body.meta.nextCursor
        let customersFirst10 =response.body.data;
        let customersLast10 =(await ahAPI.getCustomersWithParams(ahAPI.COMMON_TOKEN,"10",nextCursor,"",TestData.defaultOrgId)).body.data;
        expect(entities20.map(u=>u.id).join(",")).toContain(customersFirst10.map(u=>u.id).join(","));
        expect(entities20.map(u=>u.id).join(",")).toContain((customersLast10.map(u=>u.id)).join(","));
    })

    test("Get Customers - Get $entity - Pagination - Non-Existing cursor", async () => {
        let response =(await ahAPI.getCustomersWithParams(ahAPI.COMMON_TOKEN,"20","CH9999","",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(20)
    })
    test.each([
        { query: TestData.defaultCustomerDetails.name, descr: "Full match" },
        { query: "Elektro", descr: "Partial name" },
        { query: "elektro", descr: "Lower case" },
        { query: "für", descr: "UTF-symbols" },
        { query: "(Schweiz)", descr: "special symbols" }
    ])
    ("Get Customers - Search by name - $descr", async ({query, descr}) => {
        let response =(await ahAPI.getCustomersWithParams(ahAPI.COMMON_TOKEN,"","",query,TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u["name"]).join(",")).toBe(response.body.data.filter(u=>u["name"].toLowerCase().includes(query.toLowerCase())).map(u=>u["name"]).join(","))
    })

    test("Get Customers - Search without results", async () => {
        let response =(await ahAPI.getCustomersWithParams(ahAPI.COMMON_TOKEN,"","","blah",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data).toHaveLength(0)})

    let customerPayload={"name":"AT Customer A1",
        "address":{"city":"Wheeling",
            "address1":"300 Burlington",
            "postcode":"60090",
            "countryCode":"US"}}

    test("Customers - Create", async () => {
        let entityId
        try {
            let response = await ahAPI.createCustomer(ahAPI.COMMON_TOKEN, customerPayload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(201);
            entityId = response.body.data.EntityId
            expect(response.body.data.EntityName).toEqual(customerPayload.name);
        }catch (err){throw err}
        finally {if (entityId!==undefined)           await ahDBHelper.removeEntity(entityId)}
    })

    test.each([
        {attr: "name"},
        {attr: "address.address1"},
        {attr: "address.city"},
        {attr: "address.postcode"}
    ])
    ("Customers - Create - Empty - $attr", async ({attr}) => {

        let response
        try {
            let payload=structuredClone(customerPayload);
            let attr_path=attr.split(".");
            (attr_path.length>1)? (payload["address"][attr_path[1]]=""):(payload["name"]="");
            response = await ahAPI.createCustomer(ahAPI.COMMON_TOKEN, payload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toMatch(new RegExp(`${attr}: String must contain at least 1 character`));
        }catch (err){throw err}
        finally {if (response.body?.data?.EntityId!==undefined)           await ahDBHelper.removeEntity(response.body.data.EntityId)}
    })

   test("Customers - Create - Empty -Country", async () => {
            let payload=structuredClone(customerPayload);
            payload["address"]["countryCode"]="";
            let  response = await ahAPI.createCustomer(ahAPI.COMMON_TOKEN, payload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toMatch(new RegExp(`address.countryCode: Invalid enum value`));
    })

    test("Customers - Create - Unauthorized", async () => {
            let response = await ahAPI.createCustomer("BLAH", customerPayload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(401);
    })

    test("Customers - Create - non-existing orgId", async () => {
        let response = await ahAPI.createCustomer(ahAPI.COMMON_TOKEN, customerPayload, TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    })

    test("Customers - Create - unprivileged user", async () => {
        let TOKEN=await ahAPI.getUserToken(TestData.defaultViewerDetails);
        let response = await ahAPI.createCustomer(TOKEN, customerPayload, TestData.defaultOrgId);
        expect(response.statusCode).toBe(403);
    })
})

