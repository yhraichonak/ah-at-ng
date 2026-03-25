import { test } from '../uifixtures/resource.fixture';
import TestData from "../tests/testdata";
import {expect} from "@playwright/test";
import {sleep} from "../api/utils";

test('KUMA service', async ({ loginPage, commonPage,page }) => {
    await loginPage.navigate();
    await loginPage.doLoginAs(TestData.defaultUserDetails.email, TestData.defaultUserDetails.pass)
    const context = page.context();
    const newPagePromise = context.waitForEvent('page');
    await commonPage.clickStatusButton();
    const newPage = await newPagePromise;

    await expect(newPage).toHaveURL('https://uptime.tesedi.dev/status/assethub-stg');
    await sleep(1)
    expect(newPage.locator(".monitor-list").first()).toContainText("100%API Services")
    expect(newPage.locator(".monitor-list").first()).toContainText("100%Customer Portal")
});

