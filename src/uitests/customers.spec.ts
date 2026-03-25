import { expect } from '@playwright/test';
import { test } from '../uifixtures/resource.fixture';
import TestData from "../tests/testdata";
import {init_content_persistent_browser, try_process_relogin} from "./utils";
import {sleep} from "../api/utils";

test.beforeAll(async ({},testInfo) => {
    await init_content_persistent_browser(testInfo)
})

test.beforeEach(async ({customersPageCP}) => {
    await  customersPageCP.navigate()
});

test.afterEach(async ({cpPage,loginPageCP, dashboardPageCP}) => {
    await try_process_relogin(cpPage,loginPageCP,dashboardPageCP)
    await cpPage.context().close()
});

test('User is able to read customers list items', async ({ customersPageCP }) => {
    let tableElement=await customersPageCP.getTable();
    await tableElement.search(TestData.defaultCustomerDetails.name);
    let targetRowCellsMap=await  tableElement.findRowAsMap(TestData.defaultCustomerDetails.name)
    await expect(targetRowCellsMap["Name"]).toContain(TestData.defaultCustomerDetails.name);
    await expect(targetRowCellsMap["Address"]).toContain(TestData.defaultCustomerDetails.address);
    await expect(targetRowCellsMap["City"]).toContain(TestData.defaultCustomerDetails.city);
    await expect(targetRowCellsMap["Zip"]).toContain(TestData.defaultCustomerDetails.zip);
    await expect(targetRowCellsMap["Country"]).toContain(TestData.defaultCustomerDetails.country);
});

test('User is able to search customers by partial names', async ({ customersPageCP }) => {
    let searchQuery="gar"
    let tableElement=await customersPageCP.getTable();
    await tableElement.search(searchQuery);
    let columnValues=await  tableElement.getTableColumn("Name")
    expect(columnValues.join(",")).toContain(columnValues.filter((t)=>t.toLowerCase().includes(searchQuery)).join(","))
});

test('User is able to search non-existing customer', async ({ customersPageCP }) => {
    let searchQuery="blah"
    let tableElement=await customersPageCP.getTable();
    await tableElement.search(searchQuery);
    let columnValues=await  tableElement.getTableColumn("Name")
    expect(await  tableElement.getText()).toContain("No results.")
});

test('User is able to open customer details page', async ({ commonPageCP }) => {
    let tableElement=await commonPageCP.getTable();
    await tableElement.search(TestData.defaultCustomerDetails.name);
    await tableElement.open(TestData.defaultCustomerDetails.name);
    let breadcrumbs= await commonPageCP.getNavBreadCrumbs();
    expect(breadcrumbs).toMatch(/.*Home.*Customers.*Customer 51.*/);
});


test('User is able to trigger pagination for customers list item', async ({ commonPageCP }) => {
    await sleep(2)
    let tableElement=await commonPageCP.getTable();
    let initialRowsCount=await (await tableElement.getRows()).count();
    await commonPageCP.scrollDown();
    await commonPageCP.scrollDown();
    tableElement=await commonPageCP.getTable();
    let rowsCount=await (await tableElement.getRows()).count();
    expect(rowsCount -initialRowsCount).toEqual(50);
});
