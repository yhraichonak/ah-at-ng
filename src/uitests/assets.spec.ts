import { expect } from '@playwright/test';
import { test } from '../uifixtures/resource.fixture';
import TestData from "../tests/testdata";
import {sleep} from "../api/utils";
import ahDbHelper from "../api/AHDBHelper";
import {init_content_persistent_browser, try_process_relogin} from "./utils";
let testAsset=TestData.assetMultiSL;


test.beforeAll(async ({}, testInfo) => {
    test.setTimeout(60000)
    await ahDbHelper.enable_ff("billing_summary")
    await init_content_persistent_browser(testInfo)
})

test.beforeEach(async ({dashboardPageCP}) => {
    await dashboardPageCP.navigate()
    await sleep(1);
});

test.afterEach(async ({cpPage, loginPageCP, dashboardPageCP}) => {
    await try_process_relogin(cpPage, loginPageCP, dashboardPageCP)
    await cpPage.context().close()
});

test(`User is able to read assets details info`, async ({assetDetailsPageCP}) => {
    await assetDetailsPageCP.setOrganization(TestData.defaultOrganization);
    await sleep(1)
    await assetDetailsPageCP.navigate(testAsset["serialNumber"])
    await assetDetailsPageCP.waitForLoading()
    await  sleep(1)
    let pageObject=await assetDetailsPageCP.page.locator('body')
    await expect(pageObject).toContainText(new RegExp(`.*${testAsset["description"]}.*`));
    await expect(pageObject).toContainText(new RegExp(`.*SKU.*${testAsset["productSku"]}.*`));
    await expect(pageObject).toContainText(new RegExp(`.*Serial Number.*${testAsset["serialNumber"]}.*`));
    await expect(pageObject).toContainText(new RegExp(`.*OEM.*HPE.*`));
    await expect(pageObject).toContainText(new RegExp(`.*End Customer.*Customer 51.*`));
    await expect(pageObject).toContainText(new RegExp(`.*Active Service Levels.*`));
    await expect(pageObject).toContainText(new RegExp(`.*Active Service Levels.*`));
    await expect(pageObject).toContainText(new RegExp(`.*${testAsset["serviceLevels"][0]["description"]}.*${testAsset["serviceLevels"][0]["sku"]}.*${testAsset["serviceLevels"][0]["endDate"]}.*Active.*`));
    await expect(pageObject).toContainText(new RegExp(`.*${testAsset["serviceLevels"][1]["description"]}.*${testAsset["serviceLevels"][1]["sku"]}.*${testAsset["serviceLevels"][1]["endDate"]}.*Active.*`));
});

