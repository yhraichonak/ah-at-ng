import { expect } from '@playwright/test';
import { test } from '../uifixtures/resource.fixture';
import TestData from "../tests/testdata";
import {sleep} from "../api/utils";
import ahDbHelper from "../api/AHDBHelper";
import {init_content_persistent_browser, try_process_relogin} from "./utils";
let testSP=TestData.spMultiSL;
let expirationSP=TestData.defalutServicePackExpiration;


test.beforeAll(async ({}, testInfo) => {
    test.setTimeout(60000)
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

test(`User is able to read sp details info`, async ({spDetailsPageCP}) => {
    await spDetailsPageCP.setOrganization(TestData.altOrganization);
    await sleep(1)
    await spDetailsPageCP.navigate(testSP["id"])
    await spDetailsPageCP.waitForLoading()
    await  sleep(1)
    let pageObject=await spDetailsPageCP.page.locator('body')
    let sl1=testSP["serviceLevels"][0]
    let sl2=testSP["serviceLevels"][1]
    let hardware=TestData.spAssetMultiSL
    await expect(pageObject).toContainText(new RegExp(`.*${sl1["description"]}.*${sl1["sku"]}.*${sl1["endDate"]}.*Active.*`));
    await expect(pageObject).toContainText(new RegExp(`.*Coverage Details.*`));
    await expect(pageObject).toContainText(new RegExp(`.*Coverage.*Start.*02/23/2030.*Coverage.*End.*02/23/2031.*Duration.*1.*year.*`));
    await expect(pageObject).toContainText(new RegExp(`.*Linked Hardware.*`));
    await expect(pageObject).toContainText(new RegExp(`.*${hardware["description"]}.*Serial Number.*${hardware["serialNumber"]}.*SKU.*${hardware["productSku"]}.*`));
    await expect(pageObject).toContainText(new RegExp(`.*Other Active Services.*`));
    await expect(pageObject).toContainText(new RegExp(`.*${sl2["description"]}.*${sl2["sku"]}.*${sl2["endDate"]}.*Active.*`));
    await expect(pageObject).toContainText(new RegExp(`.*End Customer.*4B.*AG.*`));
})

test(`User is able to read sp details info - expiration date today`, async ({spDetailsPageCP, spQuotePageCP}) => {
    await spDetailsPageCP.setOrganization(TestData.altOrganization);
    let todaySQL=new Date().toISOString().split('T')[0];
    await ahDbHelper.set_sp_expiration(expirationSP.id,todaySQL)
    await sleep(1)
    await spDetailsPageCP.navigate(expirationSP["id"])
    await spDetailsPageCP.waitForLoading()
    await  sleep(1)
    let pageObject=await spDetailsPageCP.page.locator('body')
    await expect(pageObject).toContainText(new RegExp(`.*Keep your hardware protected beyond the current coverage period.*`));
    await spDetailsPageCP.clickButton("Extend Your Warranty")
    await spQuotePageCP.waitForLoading()
    await  sleep(1)
    pageObject=await spDetailsPageCP.page.locator('body')
    await expect(pageObject).toContainText(new RegExp(`.*Extend Warranty For.*`));
    const formattedDate = new Date().toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', year: 'numeric'});
    await expect(pageObject).toContainText(new RegExp(`.*Current warranty ends on ${ formattedDate}.*`));
});

test(`User is able to read sp details info - expiration date future`, async ({spDetailsPageCP, spQuotePageCP}) => {
    await spDetailsPageCP.setOrganization(TestData.altOrganization);
    let dateInstance=new Date()
    dateInstance.setFullYear(dateInstance.getFullYear() + 1)
    await ahDbHelper.set_sp_expiration(expirationSP.id,dateInstance.toISOString().split('T')[0])
    await sleep(1)
    await spDetailsPageCP.navigate(expirationSP["id"])
    await spDetailsPageCP.waitForLoading()
    await  sleep(1)
    let pageObject=await spDetailsPageCP.page.locator('body')
    await expect(pageObject).toContainText(new RegExp(`.*Renewal Not Yet Available.*`));
    await spDetailsPageCP.clickButton("View Pricing Options")
    await spQuotePageCP.waitForLoading()
    await  sleep(1)
    pageObject=await spDetailsPageCP.page.locator('body')
    await expect(pageObject).toContainText(new RegExp(`.*Extend Warranty For.*`));
    await expect(pageObject).toContainText(new RegExp(`.*Renewal window not yet open.*`));
    const formattedDate = dateInstance.toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', year: 'numeric'});
    await expect(pageObject).toContainText(new RegExp(`.*Current warranty ends on ${ formattedDate}.*`));
    await expect(pageObject).toContainText(new RegExp(`.*Renewal window not yet open.*`));
});

test(`User is able to read sp details info - expiration date in the past `, async ({spDetailsPageCP, spQuotePageCP}) => {
    await spDetailsPageCP.setOrganization(TestData.altOrganization);
    let dateInstance=new Date()
    dateInstance.setFullYear(dateInstance.getFullYear() - 1)
    await ahDbHelper.set_sp_expiration(expirationSP.id,dateInstance.toISOString().split('T')[0])
    await sleep(1)
    await spDetailsPageCP.navigate(expirationSP["id"])
    await spDetailsPageCP.waitForLoading()
    await  sleep(1)
    let pageObject=await spDetailsPageCP.page.locator('body')
    await expect(pageObject).not.toContainText(new RegExp(`.*View Pricing Options.*`));
    await expect(pageObject).not.toContainText(new RegExp(`.*Extend Your Warranty.*`));
});


test(`User is able to read sp details info - expiration date in recent path (45 days) `, async ({spDetailsPageCP, spQuotePageCP}) => {
    await spDetailsPageCP.setOrganization(TestData.altOrganization);
    const dateInstance = new Date();
    dateInstance.setDate(dateInstance.getDate() - 40);
    await ahDbHelper.set_sp_expiration(expirationSP.id,dateInstance.toISOString().split('T')[0])
    await sleep(1)
    await spDetailsPageCP.navigate(expirationSP["id"])
    await spDetailsPageCP.waitForLoading()
    await  sleep(1)
    await spDetailsPageCP.clickButton("Extend Your Warranty")
    await spQuotePageCP.waitForLoading()
    await  sleep(1)
    let pageObject=await spDetailsPageCP.page.locator('body')
    await expect(pageObject).toContainText(new RegExp(`.*Extend Warranty For.*`));
    const formattedDate = dateInstance.toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', year: 'numeric'});
    await expect(pageObject).toContainText(new RegExp(`.*Current warranty ends on ${ formattedDate}.*`));
});