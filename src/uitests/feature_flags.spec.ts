import {expect} from '@playwright/test';
import { test } from '../uifixtures/resource.fixture';
import TestData from "../tests/testdata";
import {init_content_persistent_browser, try_process_relogin} from "../uitests/utils";
import {sleep} from "../api/utils";
import ahDbHelper from "../api/AHDBHelper";
import {QuoteDetailsPage} from "../uipom/quote_details_page";
let testAsset=TestData.TEST_CONTRACT_ASSET_MAP[TestData.TEST_DATA_MODE];
test.describe("Feature Flags",  () => {
    test.describe("No Re-login",  () => {
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

    test.setTimeout(60000)
    test(`Feature Flag - Disable`, async ({commonPageCP}) => {
        await commonPageCP.setOrganization(TestData.altOrganization);
        await ahDbHelper.disable_ff("billing_summary")
        let qp = new QuoteDetailsPage(commonPageCP.page)
        await qp.navigate(TestData.quoteWithBillingSummary)
        let tabs = await qp.getSecondaryTabs()
        expect(tabs.toString()).not.toContain("Billing Summary")
        await ahDbHelper.enable_ff("billing_summary")
        await commonPageCP.refresh()
        tabs = await qp.getSecondaryTabs()
        expect(tabs.toString()).toContain("Billing Summary")
    });

    test(`Feature Flag - Enable for few organizations`, async ({commonPageCP}) => {
        await ahDbHelper.enable_ff_for_org("billing_summary", TestData.defaultOrgId + "," + TestData.altOrgId)
        await sleep(1)
        await commonPageCP.setOrganization(TestData.altOrganization);
        let qp = new QuoteDetailsPage(commonPageCP.page)
        await qp.navigate(TestData.quoteWithBillingSummary)
        await sleep(1)
        let tabs = await qp.getSecondaryTabs()
        expect(tabs.toString()).toContain("Billing Summary")

        await commonPageCP.setOrganization(TestData.defaultOrganization);
        await qp.navigate(TestData.defaultQWCQuoteId)
        qp = new QuoteDetailsPage(commonPageCP.page)
        tabs = await qp.getSecondaryTabs()
        expect(tabs.toString()).toContain("Billing Summary")

        await commonPageCP.setOrganization(TestData.altOrganization2);
        await sleep(1)
        await qp.navigate(TestData.altQuote2.id)
        await qp.page.waitForLoadState("networkidle")
        qp = new QuoteDetailsPage(commonPageCP.page)
        tabs = await qp.getSecondaryTabs()
        expect(tabs.toString()).not.toContain("Billing Summary")
    });


    test(`Feature Flag - Contract Jobs`, async ({contracsPageCP}) => {
        let ff_name = "grouped_contract_download"
        let element_locator = "button.download"
        let orig_ff_status = (await ahDbHelper.get_ff(ff_name)).enabled
        try {
            await ahDbHelper.enable_ff(ff_name)
            await contracsPageCP.navigate()
            let tableElement = await contracsPageCP.getTable()
            await tableElement.selectARow()
            expect(await contracsPageCP.getElement(element_locator)).toBeVisible()
            await ahDbHelper.disable_ff(ff_name)
            await contracsPageCP.refresh()
            await tableElement.selectARow()
            expect(await contracsPageCP.getElement(element_locator)).not.toBeAttached()
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.set_ff_status(ff_name, orig_ff_status)
        }
    });

    test(`Feature Flag - Contract Import`, async ({contracsPageCP}) => {
        let ff_name = "contract_import"
        let element_locator = "//button[contains(.,'Create Contract')]"
        let orig_ff_status = (await ahDbHelper.get_ff(ff_name)).enabled
        try {
            await ahDbHelper.enable_ff(ff_name)
            await sleep(2)
            await contracsPageCP.navigate()
            await sleep(2)
            expect(await contracsPageCP.getElement(element_locator)).toBeVisible()
            await ahDbHelper.disable_ff(ff_name)
            await sleep(1)
            await contracsPageCP.navigate()
            await sleep(1)
            expect(await contracsPageCP.getElement(element_locator)).not.toBeAttached()
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.set_ff_status(ff_name, orig_ff_status)
        }
    });

    test(`Feature Flag - Show Only Active Entities`, async ({customersPageCP}) => {
        let ff_name = "show_only_active_entities"
        let inactive_entity = TestData.inactiveEndUserDetails.name
        let orig_ff_status = (await ahDbHelper.get_ff(ff_name)).enabled
        try {
            await ahDbHelper.enable_ff(ff_name)
            await customersPageCP.navigate()
            let tableElement = await customersPageCP.getTable()
            await tableElement.search(inactive_entity)
            let results = await tableElement.getBodyAsText();
            expect(results).toEqual("No results.");
            await ahDbHelper.disable_ff(ff_name)
            await customersPageCP.refresh()
            await tableElement.search(inactive_entity)
            let customerNames = await tableElement.getTableColumn("Name")
            expect(customerNames.toString()).toEqual(inactive_entity);
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.set_ff_status(ff_name, orig_ff_status)
        }
    });

    test(`Feature Flag - Requests List`, async ({customersPageCP}) => {
        let ff_name = "requests_list"
        let orig_ff_status = (await ahDbHelper.get_ff(ff_name)).enabled
        try {
            await ahDbHelper.enable_ff(ff_name)
            await sleep(1)
            await customersPageCP.navigate()
            await sleep(1)
            let tabs = await (await customersPageCP.getSidePanelTabs()).allTextContents()
            expect(tabs.toString()).toContain("Requests");
            await ahDbHelper.disable_ff(ff_name)
            await sleep(1)
            await customersPageCP.navigate()
            tabs = await (await customersPageCP.getSidePanelTabs()).allTextContents()
            expect(tabs.toString()).not.toContain("Requests");
            await ahDbHelper.disable_ff(ff_name)
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.set_ff_status(ff_name, orig_ff_status)
        }
    });


    test(`Feature Flag - Service Packs`, async ({customersPageCP}) => {
        let ff_name = "service_pack"
        let orig_ff_status = (await ahDbHelper.get_ff(ff_name)).enabled
        try {
            await ahDbHelper.enable_ff(ff_name)
            await sleep(1)
            await customersPageCP.navigate()
            await sleep(1)
            let tabs = await (await customersPageCP.getSidePanelTabs()).allTextContents()
            expect(tabs.toString()).toContain("Service packs");
            await ahDbHelper.disable_ff(ff_name)
            await sleep(1)
            await customersPageCP.navigate()
            tabs = await (await customersPageCP.getSidePanelTabs()).allTextContents()
            expect(tabs.toString()).not.toContain("Service packs");
            await ahDbHelper.disable_ff(ff_name)
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.set_ff_status(ff_name, orig_ff_status)
        }
    });

    test(`Feature Flag - Asset Warranty`, async ({assetDetailsPageCP}) => {
        let ff_name = "asset_warranty"
        let element_locator = "//button[contains(.,'Sync')]"
        let orig_ff_status = (await ahDbHelper.get_ff(ff_name)).enabled
        try {
            await assetDetailsPageCP.setOrganization(TestData.defaultOrganization);
            await ahDbHelper.enable_ff(ff_name)
            await sleep(1)
            await assetDetailsPageCP.navigate(testAsset["serialNumber"], "?activeTab=warranty")
            await assetDetailsPageCP.waitForLoading()
            expect(await assetDetailsPageCP.getElement(element_locator)).toBeVisible()
            await ahDbHelper.disable_ff(ff_name)
            await sleep(1)
            await assetDetailsPageCP.navigate(testAsset["serialNumber"], "?activeTab=warranty")
            await sleep(1)
            expect(await assetDetailsPageCP.getElement(element_locator)).not.toBeAttached()
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.set_ff_status(ff_name, orig_ff_status)
        }
    });

    test(`Feature Flag - Global Notification bar`, async ({dashboardPageCP}) => {
        let ff_name = "global_notification_bar"
        let orig_ff_status = (await ahDbHelper.get_ff(ff_name)).enabled
        try {
            await ahDbHelper.enable_ff(ff_name)
            await sleep(2)
            await dashboardPageCP.navigate()
            await sleep(1)
            let notificatopns = await dashboardPageCP.getNotificationBarItems()
            await expect(notificatopns.first()).toBeVisible();
            await ahDbHelper.disable_ff(ff_name)
            await dashboardPageCP.navigate()
            await sleep(1)
            expect(await dashboardPageCP.getNotificationBarItems()).toHaveCount(0)
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.set_ff_status(ff_name, orig_ff_status)
        }
    });

    test(`Feature Flag - New Quote Change Request flow`, async ({quotesPageCP}) => {
        let ff_name = "new_quote_change_request_flow"
        let orig_ff_status = (await ahDbHelper.get_ff(ff_name)).enabled
        try {
            await quotesPageCP.setOrganization(TestData.altOrganization);
            await ahDbHelper.set_quote_status(TestData.defaultQuote.quoteNumber, "Open")
            await ahDbHelper.enable_ff(ff_name)
            await sleep(2)
            await quotesPageCP.navigate()
            let tableElement = await quotesPageCP.getTable();
            await tableElement.search(TestData.defaultQuote.quoteNumber);
            await tableElement.open(TestData.defaultQuote.quoteNumber);
            await quotesPageCP.clickButton("Request Change");
            expect(await quotesPageCP.getElement("xpath=//h1[contains(.,'Request Quote Change')]")).toBeVisible()
            expect(await quotesPageCP.getElement("button>svg.lucide-arrow-left")).toBeVisible()
            await ahDbHelper.disable_ff(ff_name)
            await quotesPageCP.navigate()
            tableElement = await quotesPageCP.getTable();
            await tableElement.search(TestData.defaultQuote.quoteNumber);
            await tableElement.open(TestData.defaultQuote.quoteNumber);
            await quotesPageCP.clickButton("Request Change");
            expect(await quotesPageCP.getElement("xpath=//div[@role='dialog' and contains(.,'Request Change')]")).toBeVisible()
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.set_ff_status(ff_name, orig_ff_status)
        }
    });


    test(`Feature Flag - Home Open Requests`, async ({dashboardPageCP}) => {
        let ff_name = "home_open_requests"
        let orig_ff_status = (await ahDbHelper.get_ff(ff_name)).enabled
        try {
            await ahDbHelper.enable_ff(ff_name)
            await sleep(2)
            await dashboardPageCP.navigate()
            await dashboardPageCP.waitForLoading()
            await expect(dashboardPageCP.page.locator('body')).toContainText('Open Requests');
            await ahDbHelper.disable_ff(ff_name)
            await dashboardPageCP.navigate()
            await dashboardPageCP.waitForLoading()
            await expect(dashboardPageCP.page.locator('body')).not.toContainText('Open Requests');
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.set_ff_status(ff_name, orig_ff_status)
        }
    });


    test(`Feature Flag - Status`, async ({dashboardPageCP}) => {
        let ff_name = "status_page"
        let element_locator = "//a[contains(.,'Status')]"
        let orig_ff_status = (await ahDbHelper.get_ff(ff_name)).enabled
        try {
            await ahDbHelper.enable_ff(ff_name)
            await sleep(2)
            await dashboardPageCP.navigate()
            await dashboardPageCP.waitForLoading()
            await expect(dashboardPageCP.page.locator(element_locator)).toBeVisible();
            await ahDbHelper.disable_ff(ff_name)
            await dashboardPageCP.navigate()
            await dashboardPageCP.waitForLoading()
            await expect(dashboardPageCP.page.locator(element_locator)).not.toBeAttached();
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.set_ff_status(ff_name, orig_ff_status)
        }
    });

    test(`Feature Flag - New Asset Details page`, async ({assetDetailsPageCP}) => {
        let ff_name = "new_assets_detail_page"
        let orig_ff_status = (await ahDbHelper.get_ff(ff_name)).enabled
        try {
            await assetDetailsPageCP.setOrganization(TestData.defaultOrganization);
            await ahDbHelper.enable_ff(ff_name)
            await sleep(1)
            await assetDetailsPageCP.navigate(testAsset["serialNumber"])
            await assetDetailsPageCP.waitForLoading()
            await expect(assetDetailsPageCP.page.locator('body')).toContainText('Active Service Levels');
            await ahDbHelper.disable_ff(ff_name)
            await sleep(1)
            await assetDetailsPageCP.navigate(testAsset["serialNumber"])
            await sleep(1)
            await expect(assetDetailsPageCP.page.locator('body')).not.toContainText('Active Service Levels');
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.set_ff_status(ff_name, orig_ff_status)
        }
    });
});

test.describe("Re-login",  () => {
    test.beforeEach(async ({loginPage}) => {
        await loginPage.navigate();
    });

    test(`Feature Flag - Distributor Organization`, async ({loginPage, commonPage,organizationsPage}) => {
        let ff_name = "distributor_organizations"
        let element_locator = "//label[contains(.,'Organization Type')]"
        let orig_ff_status = (await ahDbHelper.get_ff(ff_name)).enabled
        test.setTimeout(60_000);
        await loginPage.navigate();
        await loginPage.doLoginAs(TestData.saUserDetails.email, TestData.saUserDetails.pass)
        await sleep(2)
        await commonPage.setLanguage("English");
        await commonPage.setOrganization(TestData.defaultRootOrganization);
        try {
            await ahDbHelper.enable_ff(ff_name)
            await sleep(1)
            await organizationsPage.navigate()
            await organizationsPage.waitForLoading()
            await organizationsPage.clickButton("Add")
            await expect(organizationsPage.page.locator(element_locator)).toBeVisible()
            await ahDbHelper.disable_ff(ff_name)
            await sleep(1)
            await organizationsPage.navigate()
            await organizationsPage.waitForLoading()
            await organizationsPage.clickButton("Add")
            await expect(organizationsPage.page.locator(element_locator)).not.toBeAttached();
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.set_ff_status(ff_name, orig_ff_status)
        }
    });
});
    // hpe_clicker_dry_run - INVESTIGATE
    // ticket_support INVESTIGATE
    // service_pack_quote - INVESTIGATE
    // quote_pdf_with_different_formats - INVESTIGATE
    // quoted_contracts - INVESTIGATE
});
