import ahAPI from "../../api/SupertestAHAPIHelper";
import TestData from "../testdata";
import AHDBHelper from "../../api/AHDBHelper";
const { matchersWithOptions } = require('jest-json-schema');
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testUserId;
afterEach(async () => { await ahAPI.clearCommonSession();})

afterEach(async () => {
    await ahAPI.enableUser(testUserId);
    await ahAPI.clearCommonSession();
})

beforeEach(async () => {
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
    testUserId=TestData.defaultEditUserDetails["id"];
})

beforeAll(async () => {
    await TestData.initUsersAndRoles()
    testUserId=TestData.defaultEditUserDetails["id"];
    await ahAPI.enableUser(testUserId);
})

describe('[jest] Users - Disable', () => {

    test("User - Disable", async () => {
        const response = await ahAPI.disable(ahAPI.COMMON_TOKEN,testUserId, "My reason");
        expect(response.statusCode).toBe(200);
    })

    test("User - Disable - No reason", async () => {
       const response = await ahAPI.disable(ahAPI.COMMON_TOKEN,testUserId, "");
        expect(response.statusCode).toBe(200);
    })

    test("User - Disable - Disabled user", async () => {
        await ahAPI.disable(ahAPI.COMMON_TOKEN,testUserId, "");
        const response = await ahAPI.disable(ahAPI.COMMON_TOKEN,testUserId, "");
        expect(response.statusCode).toBe(200);
    })

    test("User - Disable - Unauthorized", async () => {
        const response = await ahAPI.disable("blah",testUserId, "");
        expect(response.statusCode).toBe(401);
    })

    test("User - Disable - Non existing user", async () => {
        const response = await ahAPI.disable(ahAPI.COMMON_TOKEN,TestData.nonExisingId, "Reason");
        expect(response.statusCode).toBe(400);
    })

    test("User - Disable - Unprivileged", async () => {
        let TOKEN=await ahAPI.getUserToken(TestData.defaultViewerDetails)
        const response = await ahAPI.disable(TOKEN,testUserId,"Reason");
        expect(response.statusCode).toBe(403);
    })

    test("User - Disable - Prolonged reason", async () => {
        let response = await ahAPI.disable(ahAPI.COMMON_TOKEN,testUserId, TestData.string4100+TestData.string4100+TestData.string4100+TestData.string4100);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch("String must contain at most 255 character");
    })

})

describe('[jest] Users - Enable', () => {

    test("User - Enable", async () => {
        await ahAPI.disableUser(ahAPI.COMMON_TOKEN,testUserId,TestData.defaultOrgId);
        const response = await ahAPI.postUserEnable(ahAPI.COMMON_TOKEN,testUserId,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
    })

    test("User - Enable - Enabled user", async () => {
        await ahAPI.enableUser(testUserId,TestData.defaultOrgId);
        const response =  await ahAPI.postUserEnable(ahAPI.COMMON_TOKEN,testUserId,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
    })

    test("User - Enable - Unauthorized", async () => {
        const response = await ahAPI.postUserEnable("blah",testUserId,TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("User - Enable - Non existing user", async () => {
        const response = await ahAPI.postUserEnable(ahAPI.COMMON_TOKEN,TestData.nonExisingId, TestData.defaultOrgId);
        expect(response.statusCode).toBe(400);
    })

    test("User - Enable - Unprivileged", async () => {
        let TOKEN=await ahAPI.getUserToken(TestData.defaultViewerDetails)
        const response = await ahAPI.postUserEnable(TOKEN,testUserId, TestData.defaultOrgId);
        expect(response.statusCode).toBe(403);
    })

})
