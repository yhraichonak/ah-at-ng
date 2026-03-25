import ahAPI from "../../api/SupertestAHAPIHelper";
import TestData from "../testdata";
const { matchersWithOptions } = require('jest-json-schema');
const schema = require('../schema.json');
expect.extend(matchersWithOptions({schemas: [schema]}));
// TODO: restore once functionality is fixed
describe('[jest] Revoke', () => {

    test("Revoke", async () => {
        const token=await ahAPI.getUserToken(TestData.defaultUserDetails);
        const response = await ahAPI.revoke(token);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({status: true})
    })
    test("Use revoked token", async () => {
        const token=await ahAPI.getUserToken(TestData.defaultUserDetails);
        await ahAPI.revoke(token);
        const response = await ahAPI.getPermissions(token);
        expect(response.statusCode).toBe(401);
    })
    test("Revoke - Unauthorized", async () => {
        const response = await ahAPI.revoke("blahblablah");
        expect(response.statusCode).toBe(401);
    })
})
