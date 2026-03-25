import {expect} from '@playwright/test';
import { test } from '../uifixtures/resource.fixture';
import TestData from "../tests/testdata";
import {sleep} from "../api/utils";
import ahDbHelper from "../api/AHDBHelper";

test.describe("Using re-login",  () => {
    test.beforeEach(async ({loginPage,dashboardPage}) => {
        let ff_name = "global_notification_bar"
        test.setTimeout(60_000);
        await loginPage.navigate();
        await loginPage.doLoginAs(TestData.defaultUserDetails.email, TestData.defaultUserDetails.pass)
        await sleep(2)
        await ahDbHelper.enable_ff(ff_name)
        await sleep(2)
        await dashboardPage.navigate()
        await sleep(1)
    });

    test.afterEach(async () => {
        let ff_name = "global_notification_bar"
        await ahDbHelper.enable_ff(ff_name)
    });

    test(`Global notification - notification types`, async ({dashboardPage}) => {
            let notificatopns = await dashboardPage.getNotificationBarItems()
            await expect(notificatopns.filter({ hasText: "AT notification info" }).first()).toHaveClass(/blue/);
            await expect(notificatopns.filter({ hasText: "AT notification error" }).first()).toHaveClass(/red/);
            await expect(notificatopns.filter({ hasText: "AT notification warning" }).first()).toHaveClass(/yellow/);
    });

    test(`Global notification - languages`, async ({dashboardPage}) => {
        let notificatopns = await dashboardPage.getNotificationBarItems()
        await dashboardPage.setLanguage("English");
        await expect(notificatopns.filter({ hasText: "AT notification warning (EN)" })).toBeVisible();
        await dashboardPage.setLanguage("Deutsch");
        await expect(notificatopns.filter({ hasText: "AT notification warning (DE)" })).toBeVisible();
        await dashboardPage.setLanguage("Français");
        await expect(notificatopns.filter({ hasText: "AT notification warning (FR)" })).toBeVisible();
        await dashboardPage.setLanguage("Italiano");
        await expect(notificatopns.filter({ hasText: "AT notification warning (IT)" })).toBeVisible();
    });

    test(`Global notification - close`, async ({loginPage,dashboardPage}) => {
            let notificatopns = await dashboardPage.getNotificationBarItems()
            await dashboardPage.setLanguage("English");
            await notificatopns.filter({ hasText: "AT notification warning (EN)" })
                 .locator("button[aria-label='Dismiss notification']").click()
            await dashboardPage.refresh()
            expect(notificatopns.filter({ hasText: "AT notification warning (EN)" })).toHaveCount(0)
    });

    test(`Global notification - actions`, async ({dashboardPage}) => {
            let notificatopns = await dashboardPage.getNotificationBarItems()
            await dashboardPage.setLanguage("Deutsch");
            await notificatopns.filter({ hasText: "AT notification warning (DE)" }).locator("a").click()
            await expect(dashboardPage.page).toHaveURL(/google/);
    });
});