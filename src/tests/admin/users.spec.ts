import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));

describe('[jest] Admin Users', () => {

    afterEach(async () => {
        await ahAPI.clearCommonSession();
    })

    beforeEach(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        await ahAPI.getCommonSessionForSA();
    });

    test("Get Users", async () => {
        let response =await ahAPI.getAllUsers(ahAPI.COMMON_SA_TOKEN,TestData.superOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/users'})
    })

    test("Get Users - Info", async () => {
        let testUser=TestData.defaultUserDetails;
        let response =await ahAPI.getAllUsers(ahAPI.COMMON_SA_TOKEN,TestData.superOrgId, "?search="+testUser.email);
        expect(response.statusCode).toBe(200);
        let targetUser=response.body.data.find(t=> t["email"]===testUser["email"])
        expect(targetUser.fname).toEqual(testUser["firstName"]);
        expect(targetUser.lname).toEqual(testUser["lastName"]);
        expect(targetUser.isActive).toEqual(testUser["isActive"]);
    })


    test("Get Users - Unauthorized", async () => {
        let response =await ahAPI.getAllUsers("blah",TestData.superOrgId);
        expect(response.statusCode).toBe(401);
    })


    test("Get Users - Unprivileged", async () => {
        let TOKEN= await ahAPI.getUserToken(TestData.defaultViewerDetails);
        let response =await ahAPI.getAllUsers(TOKEN,TestData.superOrgId);
        expect(response.statusCode).toBe(403);
    })


    test.each([
        {  query: "test" },
        {  query: TestData.defaultUserDetails.email }
    ])
    ("Get Users - Search - $query", async ({query}) => {
        let response =await ahAPI.getAllUsers(ahAPI.COMMON_SA_TOKEN,TestData.superOrgId,`?search=${encodeURIComponent(query)}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u["email"]).join(",")).toBe(response.body.data.filter(u=>u["email"].toLowerCase().includes(query.toLowerCase()) ||u["firstName"].toLowerCase().includes(query.toLowerCase())||u["lastName"].toLowerCase().includes(query.toLowerCase())).map(u=>u["email"]).join(","))
    })

    test("Get Users - Search without results", async () => {
        const response = await ahAPI.getAllUsers(
            ahAPI.COMMON_SA_TOKEN, TestData.superOrgId,`?search=blah`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(0);
    });

})