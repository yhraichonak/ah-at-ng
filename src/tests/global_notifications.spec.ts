import ahAPI from "../api/SupertestAHAPIHelper";
import * as allure from "allure-js-commons";
import TestData from "./testdata";
const { matchersWithOptions } = require('jest-json-schema');
import {sleep} from "../api/utils";
import ahDbHelper from "../api/AHDBHelper";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));

afterEach(async () => {
    await ahDbHelper.disable_ff("global_notification_bar")
    await ahAPI.clearCommonSession();
})
beforeAll(async () => {await ahAPI.getCommonSessionForSA()})
beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})

describe('[jest] Global Notifications', () => {

    test("Global Notifications", async () => {
        await ahDbHelper.enable_ff("global_notification_bar")
        await sleep(1)
        const response = await ahAPI.getGlobalNotifications( ahAPI.COMMON_TOKEN, TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema({$ref: 'schema#/definitions/notifications'})
    })

    test("Global Notifications - Info", async () => {
        await ahDbHelper.enable_ff("global_notification_bar")
        await sleep(1)
        const response = await ahAPI.getGlobalNotifications( ahAPI.COMMON_TOKEN, TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        let targetNotification=response.body.find(t=> t["urgency"]==="info")
        expect(JSON.stringify(targetNotification["content"])).toContain("notification info");
        expect(targetNotification["startDate"]).toContain("2025-12-22");
        expect(targetNotification["endDate"]).toContain("2028-01-12");
    })


    test("Global Notifications - Disabled ff", async () => {
        await ahDbHelper.disable_ff("global_notification_bar")
        await sleep(1)
        const response = await ahAPI.getGlobalNotifications( ahAPI.COMMON_TOKEN, TestData.defaultOrgId);
        expect(response.statusCode).toBe(403);
        expect(response.body.message).toContain("errors.FEATURE.FEATURE_IS_DISABLED");
    })

    test("{KNOWN ISSUE}: Global Notifications - Unauthorized", async () => {
        await allure.issue("AH-1518")
        await ahDbHelper.enable_ff("global_notification_bar")
        await sleep(1)
        const response = await ahAPI.getGlobalNotifications("blah",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("{KNOWN ISSUE}: Global Notifications - Unknown orgId", async () => {
        await allure.issue("AH-1518")
        await ahDbHelper.enable_ff("global_notification_bar")
        await sleep(1)
        const response = await ahAPI.getGlobalNotifications(ahAPI.COMMON_TOKEN,TestData.nonExisingId);
        expect(response.statusCode).toBe(401);
    })

    test("Global Notifications - Expired", async () => {
        try {
            await ahDbHelper.enable_ff("global_notification_bar")
            await ahDbHelper.update_global_notification("notification info", "start_date='2027-12-22 14:01:49.163000 +00:00'")
            await sleep(1)
            const response = await ahAPI.getGlobalNotifications(ahAPI.COMMON_TOKEN, TestData.nonExisingId);
            expect(response.statusCode).toBe(200);
            expect(JSON.stringify(response.body)).not.toContain("notification info");
        }catch (err){ throw err; }
        finally {
            await ahDbHelper.update_global_notification("notification info", "start_date='2025-12-22 14:01:49.163000 +00:00', end_date='2028-01-12 14:01:03.687000 +00:00'")
        }
    })

    test("Global Notifications - Future", async () => {
        try {
            await ahDbHelper.enable_ff("global_notification_bar")
            await ahDbHelper.update_global_notification("notification info", "end_date='2025-12-24 14:01:49.163000 +00:00'")
            await sleep(1)
            const response = await ahAPI.getGlobalNotifications(ahAPI.COMMON_TOKEN, TestData.nonExisingId);
            expect(response.statusCode).toBe(200);
            expect(JSON.stringify(response.body)).not.toContain("notification info");
        }catch (err){ throw err; }
        finally {
            await ahDbHelper.update_global_notification("notification info", "start_date='2025-12-22 14:01:49.163000 +00:00', end_date='2028-01-12 14:01:03.687000 +00:00'")
        }
    })

})
