import {expect} from '@playwright/test';
import { test } from '../uifixtures/resource.fixture';
import TestData from "../tests/testdata";
import commonHelper from "../api/CommonHelper";
import {init_content_persistent_browser, try_process_relogin} from "../uitests/utils";
import {sleep,process_column_values} from "../api/utils";
import {DashboardPage} from "../uipom/dashboard_page";
import {QuotesListPage} from "../uipom/quotes_list_page";

let testQuote=TestData.TEST_QUOTE_MAP[TestData.TEST_DATA_MODE];
let testQuoteContract=TestData.TEST_QUOTE_CONTRACT_MAP[TestData.TEST_DATA_MODE];

let testQuoteRequest={
    "customer":TestData.defaultEndUserDetails.name,
    "message":"Test message",
    "assets":[
        { "serialNumber":"11111",  "productSKU":"2222",  "serviceGroup":"HPE Foundation Care 24x7 Service", "endDate":"06/06/2026",},
        { "serialNumber":"33333",  "productSKU":"4444",  "serviceGroup":"HPE Foundation Care 24x7 Service", "endDate":"06/06/2026",},
    ],
    "files":[
        "src/tests/poFile.pdf"
    ]
}
test.setTimeout(50000);
test.beforeAll(async ({},testInfo) => {
    test.setTimeout(50000);
    await init_content_persistent_browser(testInfo)
    sleep(2)
})

test.beforeEach(async ({loginPageCP, quotesPageCP}) => {
    await  quotesPageCP.navigate()
    await  sleep(1);
});

test.afterEach(async ({cpPage,loginPageCP, dashboardPageCP}) => {
    await try_process_relogin(cpPage,loginPageCP,dashboardPageCP )
    await cpPage.context().close()
});

test('User is able to read quotes list items', async ({ quotesPageCP }) => {
    let tableElement=await quotesPageCP.getTable();
    await tableElement.search(testQuote.quoteNo);
    await sleep(1)
    let targetRowCellsMap=await  tableElement.findRowAsMap(testQuote.quoteNo)
    await expect(targetRowCellsMap["Quote Number"]).toContain(testQuote.quoteNo);
    await expect(targetRowCellsMap["Status"]).toContain(testQuote.status);
    await expect(targetRowCellsMap["Group ID"]).toContain(testQuote.groupId);
    await expect(targetRowCellsMap["Start Date"]).toContain(testQuote.startDateShort);
    await expect(targetRowCellsMap["Reseller Price"]).toContain(testQuote.resellerPrice);
    await expect(targetRowCellsMap["End Customer"]).toContain(testQuote.endCustomer);
});

test('User is able to set quotes list column visibility', async ({ quotesPageCP }) => {
    let tableElement=await quotesPageCP.getTable();
    await tableElement.setColumnVisibility("Status", false);
    expect(await tableElement.getHeaders()).not.toContain("Status");
    await sleep(0.5)
    await tableElement.setColumnVisibility("Status", true);
    expect(await tableElement.getHeaders()).toContain("Status");
});


const testData = [
    { columnName: "Quote Number" },
    { columnName: "Status"},
    { columnName: "Group ID" },
    { columnName: "End Customer" },
    { columnName: "Start Date" },
    { columnName: "End Date" },
    { columnName: "Reseller Price" },
    { columnName: "Retail Price" },
];
    testData.forEach(({columnName}) => {
        test(`User is able to sort quotes by column "${columnName}"`, async ({quotesPageCP}) => {
            await sleep(1)
            let tableElement = await quotesPageCP.getTable();
            let column = await tableElement.getTableColumnElement(columnName);
            await column.click();
            await sleep(1)
            let columnCells = await tableElement.getTableColumn(columnName)
            columnCells=process_column_values(columnName,columnCells)
            let actualOrderString = columnCells.toString()
            let expectedOrderString=await commonHelper.verifySorting(columnCells,columnName,"asc",false);
            expect(actualOrderString).toEqual(expectedOrderString);
            await (column).click();
            await sleep(1)
            columnCells = await tableElement.getTableColumn(columnName)
            columnCells=process_column_values(columnName,columnCells)
            actualOrderString = columnCells.toString()
            expectedOrderString=await commonHelper.verifySorting(columnCells,columnName,"desc",false);
            expect(actualOrderString).toEqual(expectedOrderString);
        });
    });

test('User is able to search matching items on quotes list items', async ({ quotesPageCP }) => {
    let tableElement=await quotesPageCP.getTable();
    await tableElement.search(testQuote['quoteNo']);
    let quoteNumbers=await tableElement.getTableColumn("Quote Number")
    expect(quoteNumbers.toString()).toEqual(testQuote['quoteNo']);
});

test('User is able to search non-matching items on quotes list items', async ({ quotesPageCP }) => {
    let tableElement=await quotesPageCP.getTable();
    await tableElement.search("blah");
    let results=await tableElement.getBodyAsText();
    expect(results).toEqual("No results.");
});


test('User is able to use pagination for quotes list items', async ({ quotesPageCP, contracsPageCP}) => {
    await contracsPageCP.navigate()
    await quotesPageCP.navigate()
    await sleep(1)
    let tableElement=await quotesPageCP.getTable();
    let initialRowsCount=await (await tableElement.getRows()).count();
    await quotesPageCP.scrollDown();
    await sleep(1)
    await quotesPageCP.scrollDown();
    tableElement=await quotesPageCP.getTable();
    let rowsCount=await (await tableElement.getRows()).count();
    expect(rowsCount -initialRowsCount).toEqual(50);
});

test('User is able to see quote details', async ({ commonPageCP }) => {
    let tableElement=await commonPageCP.getTable();
    await tableElement.search(testQuote.quoteNo);
    await tableElement.open(testQuote.quoteNo);
    let pageText= await commonPageCP.getTextContent();
    expect(pageText).toMatch(/.*DUM2383497725.*Ordered.*/);
    expect(pageText).toMatch(/.*Retail PriceCHF.*40,286.60.*/);
    expect(pageText).toMatch(/.*Reseller PriceCHF.*38,135.98.*/);
    expect(pageText).toMatch(/.*End Customer.*Customer 51.*/);
    expect(pageText).toMatch(/.*Group ID.*2e19b37993e92f17.*/);
});

test('User is able to see Assets on quote details page', async ({ quotesPageCP,commonPageCP }) => {
    if (await  commonPageCP.setOrganization(TestData.altOrganization)){
        await  quotesPageCP.navigate()
        await  sleep(1);
    }
    let tableElement=await commonPageCP.getTable();
    await tableElement.search(TestData.defaultQuoteWithDetails.quoteNumber);
    await tableElement.open(TestData.defaultQuoteWithDetails.quoteNumber);
    await commonPageCP.openTab("Assets")
    let currentTab=await (await  commonPageCP.getActiveTab()).textContent();
    expect(currentTab).toEqual("Assets");
    await  sleep(1)
    let assetsTable=await commonPageCP.getTable();
    let targetRowCellsMap=await  assetsTable.findRowAsMap(TestData.defaultQuoteWithDetailsAsset.name)
    await expect(targetRowCellsMap["Name"]).toContain(TestData.defaultQuoteWithDetailsAsset.name);
    await expect(targetRowCellsMap["Serial Number"]).toContain(TestData.defaultQuoteWithDetailsAsset.serialNumber);
    // await expect(targetRowCellsMap["Service Group SKU"]).toContain(TestData.defaultQuoteWithDetailsAsset.serviceGroup)
});

test('User is able to see Contracts on quote details page', async ({ commonPageCP, quotesPageCP }) => {
    if (await  commonPageCP.setOrganization(TestData.defaultOrganization)){
        await  quotesPageCP.navigate()
        await  sleep(1);
    }
    let tableElement=await quotesPageCP.getTable();
    await tableElement.search(testQuote.quoteNo);
    await tableElement.open(testQuote.quoteNo);
    await commonPageCP.openTab("Contracts")
    let currentTab=await (await  quotesPageCP.getActiveTab()).textContent();
    expect(currentTab).toEqual("Contracts");
    await commonHelper.sleep(500)
    let contractsTable=await commonPageCP.getTable();
    tableElement=await quotesPageCP.getTable();
    await tableElement.search(testQuoteContract["contractNumber"]);
    let targetRowCellsMap=await  contractsTable.findRowAsMap(testQuoteContract["contractNumber"])
    await expect(targetRowCellsMap["Contract no."]).toContain(testQuoteContract["contractNumber"]);
    await expect(targetRowCellsMap["Status"]).toContain(testQuoteContract["status"])
    await expect(targetRowCellsMap["SAR Number"]).toContain(testQuoteContract["sar"]);
    await expect(targetRowCellsMap["Start Date"]).toContain(testQuoteContract["startDateShort"]);
    await expect(targetRowCellsMap["End Date"]).toContain(testQuoteContract["endDateShort"]);

});

test('User is able to search Assets on quote details page', async ({ commonPageCP, quotesPageCP }) => {
    if (await  commonPageCP.setOrganization(TestData.altOrganization)){
        await  quotesPageCP.navigate()
        await  sleep(1);
    }
    let searchQuery="2400"
    let tableElement=await quotesPageCP.getTable();
    await tableElement.search(TestData.defaultQuoteWithDetails.quoteNumber);
    await tableElement.open(TestData.defaultQuoteWithDetails.quoteNumber);
    await commonPageCP.openTab("Assets")
    await commonHelper.sleep(500)
    let assetsTable=await commonPageCP.getTable();
    await assetsTable.search(searchQuery);
    await commonHelper.sleep(1000)
    let nameColumn=await assetsTable.getTableColumn("Name")
    expect(nameColumn.join(",")).toContain(nameColumn.filter((t)=>t.includes(searchQuery)).join(","))
});

test('User is able to search Contracts on quote details page', async ({ commonPageCP, quotesPageCP }) => {
    if (await  commonPageCP.setOrganization(TestData.defaultOrganization)){
        await  quotesPageCP.navigate()
        await  sleep(1);
    }
    let searchQuery=testQuoteContract["contractNumber"].substring(0,3);
    let tableElement=await quotesPageCP.getTable();
    await tableElement.searchAndOpen(testQuote.quoteNo);
    await commonPageCP.openTab("Contracts")
    await commonHelper.sleep(500)
    let contractsTable=await commonPageCP.getTable();
    await contractsTable.search(searchQuery);
    await commonHelper.sleep(1000)
    let nameColumn=await contractsTable.getTableColumn("Contract no.")
    expect(nameColumn.join(",")).toContain(nameColumn.filter((t)=>t.includes(searchQuery)).join(","))
});

test('User is able to Leave Request Quote', async ({quotesPageCP,commonPageCP }) => {
    let quoteRequestDialog=await quotesPageCP.openQuoteRequestForm();
    await quoteRequestDialog.fillQuoteDetails(testQuoteRequest)
    await commonPageCP.navigateMenu("Dashboard")
    await quotesPageCP.processUnsavedChangesDialog(false)
    await sleep(1)
    expect(commonPageCP.page.url().toString()).toContain(DashboardPage.PAGE_URL)
});

test('User is able to Stay Request Quote', async ({quotesPageCP,commonPageCP }) => {
    let quoteRequestDialog=await quotesPageCP.openQuoteRequestForm();
    await quoteRequestDialog.fillQuoteDetails(testQuoteRequest)
    await commonPageCP.navigateMenu("Dashboard")
    await quotesPageCP.processUnsavedChangesDialog(true)
    await sleep(1)
    expect(commonPageCP.page.url().toString()).toContain(QuotesListPage.REQUEST_QUOTE_PAGE_URL)
    const text = await commonPageCP.page.textContent('body');
    expect(text).toMatch(/Customer 51/)
    expect(text).toMatch(/111112222June 6th, 2026HPE Foundation Care 24x7 Service/)
    expect(text).toMatch(/333334444June 6th, 2026HPE Foundation Care 24x7 Service/)
    expect(text).toMatch(/Message.*Test message/)
});

test.skip('User is able to open PDF preview for quote', async () => {
    test.skip(true,"Playwright does not render PDF in UI tests. Use API tests instead");
});