import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import commonHelper from "../../api/CommonHelper";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));

describe('[jest] Admin Organizations', () => {

    afterEach(async () => {
        await ahAPI.clearCommonSession();
    })

    beforeEach(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        await ahAPI.getCommonSessionForSA();
    });


    test("Get Admin Organizations", async () => {
        let response =await ahAPI.getAdminOrganizations(ahAPI.COMMON_SA_TOKEN,TestData.superOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/organizations'})
    })

    test("Get Admin Organizations - Info", async () => {
        let testOrg=TestData.defaultOrganizationDetails;
        let response =await ahAPI.getAdminOrganizations(ahAPI.COMMON_SA_TOKEN,TestData.superOrgId);
        expect(response.statusCode).toBe(200);
        let targetOrg=response.body.data.find(t=> t["name"]===testOrg["name"])
        expect(targetOrg.id).toEqual(testOrg["id"]);
        expect(targetOrg.name).toEqual(testOrg["name"]);
        expect(targetOrg.status).toEqual(testOrg["status"]);
        expect(targetOrg.emailable).toEqual(testOrg["emailable"]);
    })


    test("Get Admin Organizations - Unauthorized", async () => {
        let response =await ahAPI.getAdminOrganizations("blah",TestData.superOrgId);
        expect(response.statusCode).toBe(401);
    })


    test("Get Admin Organizations - Unprivileged", async () => {
        let TOKEN= await ahAPI.getUserToken(TestData.defaultViewerDetails);
        let response =await ahAPI.getAdminOrganizations(TOKEN,TestData.superOrgId);
        expect(response.statusCode).toBe(403);
    })


    test.each([
        {  query: "test" },
        {  query: TestData.defaultOrganizationDetails.name }
    ])
    ("Get Admin Organizations - Search - $query", async ({query}) => {
        let response =await ahAPI.getAdminOrganizationsWithParams(ahAPI.COMMON_SA_TOKEN,TestData.superOrgId,`?search=${encodeURIComponent(query)}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u["name"]).join(",")).toBe(response.body.data.filter(u=>u["name"].toLowerCase().includes(query.toLowerCase())).map(u=>u["name"]).join(","))
    })

    test("Get Admin Organizations - Search without results", async () => {
        const response = await ahAPI.getAdminOrganizationsWithParams(
            ahAPI.COMMON_SA_TOKEN, TestData.superOrgId,`?search=blah`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(0);
    });


    test.each([
        { attr:"status",order:"asc" },
        { attr:"status",order:"desc" },
        { attr:"createdAt",order:"asc" },
        { attr:"createdAt",order:"desc" }
    ])
    (`Get Admin Organizations - Sorting by $attr in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getAdminOrganizationsWithParams( ahAPI.COMMON_SA_TOKEN,TestData.superOrgId,`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder:[]= response.body.data.map(t=>t[attr])
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order);
        expect(actualOrderString).toEqual(expectedOrderString);
    })


    test.each([
        { attr:"name",order:"asc" },
        { attr:"name",order:"desc" },
    ])
    (`Get Admin Organizations - Sorting by Name in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getAdminOrganizationsWithParams( ahAPI.COMMON_SA_TOKEN,TestData.superOrgId,`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder:[]= response.body.data.map(t=>t[attr])
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order,false);
        expect(actualOrderString).toEqual(expectedOrderString);
    })
})