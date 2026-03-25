import {chromium, expect} from '@playwright/test';
import { test } from '../uifixtures/resource.fixture';
import TestData from "../tests/testdata";
import commonHelper from "../api/CommonHelper";
import freshdeskHelper from "../api/FreshdeskHelper";
import fs from "fs";
import {sleep,process_column_values} from "../api/utils";
import {init_content_persistent_browser, try_process_relogin} from "../uitests/utils";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
let testContract=TestData.TEST_CONTRACT_MAP[TestData.TEST_DATA_MODE];
let testContractAsset=TestData.TEST_CONTRACT_ASSET_MAP[TestData.TEST_DATA_MODE];
let testQuote=TestData.TEST_QUOTE_MAP[TestData.TEST_DATA_MODE];
test.beforeAll(async ({},testInfo) => {
    await init_content_persistent_browser(testInfo)
    await TestData.initUsersAndRoles()
})

test.beforeEach(async ({contracsPageCP}) => {
    await  contracsPageCP.navigate()
    await  sleep(1);
    await contracsPageCP.waitForLoading()
});

test.afterEach(async ({cpPage,loginPageCP, dashboardPageCP}) => {
    await try_process_relogin(cpPage,loginPageCP,dashboardPageCP)
    await cpPage.context().close()
});

test('User is able to read contracts list items', async ({commonPageCP }) => {
    let tableElement=await commonPageCP.getTable();
    await tableElement.search(testContract.contractNumber);
    await sleep(1)
    let targetRowCellsMap=await  tableElement.findRowAsMap(testContract.contractNumber)
    await expect(targetRowCellsMap["Contract no."]).toContain(testContract.contractNumber);
    await expect(targetRowCellsMap["SAR Number"]).toContain(testContract.sar);
    await expect(targetRowCellsMap["Status"]).toContain(testContract.status);
    await expect(targetRowCellsMap["Group ID"]).toContain(testContract.groupId);
    await expect(targetRowCellsMap["Start Date"]).toContain(testContract.startDateShort);
    await expect(targetRowCellsMap["End Date"]).toContain(testContract.endDateShort);
    await expect(targetRowCellsMap["End Customer"]).toContain(testContract.endCustomer);
});

test('User is able to set contracts list column visibility', async ({ commonPageCP }) => {
    let tableElement=await commonPageCP.getTable();
    await tableElement.setColumnVisibility("Status", false);
    expect(await tableElement.getHeaders()).not.toContain("Status");
    await delay(500);
    await tableElement.setColumnVisibility("Status", true);
    expect(await tableElement.getHeaders()).toContain("Status");
});

const testData = [
    { columnName: "Contract no." },
    { columnName: "SAR Number"},
    { columnName: "Status" },
    { columnName: "Group ID" },
];
    testData.forEach(({columnName}) => {
        test(`User is able to sort contracts by column "${columnName}"`, async ({commonPageCP}) => {
            let tableElement = await commonPageCP.getTable();
            await (await tableElement.getTableColumnElement(columnName)).click()
            await commonPageCP.waitForLoading();
            let origOrder= (await tableElement.getTableColumn(columnName))
            let actualOrderString=origOrder.join(",");
            let expectedOrderString=await commonHelper.verifySorting(origOrder,columnName,"asc");
            expect(actualOrderString).toEqual(expectedOrderString);
            await (await tableElement.getTableColumnElement(columnName)).click()
            await commonPageCP.waitForLoading();
            origOrder= (await tableElement.getTableColumn(columnName))
            actualOrderString=origOrder.join(",");
            expectedOrderString=await commonHelper.verifySorting(origOrder,columnName,"desc");
            expect(actualOrderString).toEqual(expectedOrderString);

        });
    });

test('User is able to search matching items on contracts list items', async ({ commonPageCP }) => {
    let tableElement=await commonPageCP.getTable();
    await tableElement.search(testContract.contractNumber);
    await commonPageCP.waitForLoading()
    let contractNumbers=await tableElement.getTableColumn("Contract no.")
    expect(contractNumbers.toString()).toEqual(testContract.contractNumber);
});

test('User is able to search non-matching items on contract list items', async ({ commonPageCP }) => {
    let tableElement=await commonPageCP.getTable();
    await tableElement.search("blah");
    let results=await tableElement.getBodyAsText();
    expect(results).toEqual("No results.");
});

test('User is able to filter contracts by Status', async ({ commonPageCP }) => {
    await commonPageCP.setStatusFilters(["Expired"]);
    await sleep(1)
    let tableElement=await commonPageCP.getTable();
    let contractStatuses=await tableElement.getTableColumn("Status")
    expect([...new Set(contractStatuses)].toString()).toEqual(`Expired`);
});


test('User is able to use pagination for contracts list items', async ({ commonPageCP }) => {
    let tableElement=await commonPageCP.getTable();
    let initialRowsCount=await (await tableElement.getRows()).count();
    await commonPageCP.scrollDown();
    await commonPageCP.scrollDown();
    tableElement=await commonPageCP.getTable();
    let rowsCount=await (await tableElement.getRows()).count();
    expect(rowsCount -initialRowsCount).toEqual(50);
});


test('User is able to see contract details', async ({ commonPageCP }) => {
    let tableElement=await commonPageCP.getTable();
    await tableElement.search(testContract.contractNumber);
    await tableElement.open(testContract.contractNumber);
    await tableElement.setColumnVisibility("Reseller Price", true);
    await tableElement.setColumnVisibility("Retail Price", true);
    let pageText= await commonPageCP.getTextContent();
    expect(pageText).toMatch(new RegExp(`.*${testContract.contractNumber}.*${testContract.status}.*`));
    expect(pageText).toMatch(new RegExp(`.*Retail Price.*${testContract.retailPrice}.*`));
    expect(pageText).toMatch(new RegExp(`.*Reseller Price.*${testContract.resellerPrice}.*`));
    expect(pageText).toMatch(new RegExp(`.*${testContract.startDateShort}.*${testContract.endDateShort}.*`));
    expect(pageText).toMatch(new RegExp(`.*Group ID.*${testContract.groupId}.*`));
});


test('User is able to see Assets on contract details page', async ({ commonPageCP }) => {
    let tableElement=await commonPageCP.getTable();
    await tableElement.searchAndOpen(testContract.contractNumber);
    await commonPageCP.openTab("Assets")
    let currentTab=await (await  commonPageCP.getActiveTab()).textContent();
    expect(currentTab).toEqual("Assets");
    await sleep(1)
    let assetsTable=await commonPageCP.getTable();
    let targetRowCellsMap=await  assetsTable.findRowAsMap(testContractAsset.serialNumber)
    await expect(targetRowCellsMap["Name"]).toContain(testContractAsset.name);
    await expect(targetRowCellsMap["Serial Number"]).toContain(testContractAsset.serialNumber);
    await expect(targetRowCellsMap["Service Group SKU"]).toContain(testContractAsset.serviceGroupSKU)
});


[{ columnName: "Reseller Price" },
 { columnName: "Product SKU" },
].forEach(({columnName}) => {
    test(`User is able to sort Assets on contract details by ${columnName}`, async ({ commonPageCP }) => {
        let tableElement=await commonPageCP.getTable();
        await tableElement.searchAndOpen(TestData.defaultQWCContract.contractNumber);
        await commonPageCP.openTab("Assets")
        let assetsTable=await commonPageCP.getTable();
        await sleep(1)
        await (await assetsTable.getTableColumnElement(columnName)).click()
        await sleep(1)
        let origOrder= (await tableElement.getTableColumn(columnName))
        origOrder=process_column_values(columnName,origOrder)
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,columnName,"asc");
        expect(actualOrderString).toEqual(expectedOrderString);
        await (await tableElement.getTableColumnElement(columnName)).click()
        await sleep(1)
        origOrder= (await tableElement.getTableColumn(columnName))
        origOrder=process_column_values(columnName,origOrder)
        actualOrderString=origOrder.join(",");
        expectedOrderString=await commonHelper.verifySorting(origOrder,columnName,"desc");
        expect(actualOrderString).toEqual(expectedOrderString);
    });
});



test('User is able to search Assets on contract details page', async ({ commonPageCP }) => {
    let tableElement=await commonPageCP.getTable();
    await tableElement.searchAndOpen(testContract.contractNumber);
    await commonPageCP.openTab("Assets")
    let assetsTable=await commonPageCP.getTable();
    await assetsTable.search(testContractAsset.serialNumber);
    await sleep(1)
    let targetColumns=await assetsTable.getTableColumn("Serial Number")
    expect(targetColumns.join(",")).toContain(targetColumns.filter((t)=>t.includes(testContractAsset.serialNumber)).join(","))
});

test('User is able to filter Assets on contract details by Show Priced', async ({ commonPageCP }) => {
    let tableElement=await commonPageCP.getTable();
    await tableElement.searchAndOpen(TestData.defaultQWCContract.contractNumber);
    await commonPageCP.openTab("Assets")
    await commonPageCP.toggleShowPricedFilter()
    await sleep(1)
    let retailPrices=await tableElement.getTableColumn("Retail Price")
    expect(retailPrices.filter((t)=>t==="-")).toHaveLength(0)
});


test('User is able to see Quotes on contract details page', async ({ commonPageCP }) => {
    let tableElement=await commonPageCP.getTable();
    await tableElement.searchAndOpen(testContract.contractNumber);
    await commonPageCP.openTab("Quotes")
    expect(await (await  commonPageCP.getActiveTab()).textContent()).toEqual("Quotes");
    await tableElement.setColumnVisibility("Retail Price", true);
    await sleep(1)
    let tableItems=await commonPageCP.getTable();
    let targetRowCellsMap=await  tableItems.findRowAsMap(testQuote.quoteNo)
    await expect(targetRowCellsMap["Quote Number"]).toContain(testQuote.quoteNo);
    await expect(targetRowCellsMap["Status"]).toContain(testQuote.status);
    await expect(targetRowCellsMap["Start Date"]).toContain(testQuote.startDateShort);
    await expect(targetRowCellsMap["Group ID"]).toContain(testQuote.groupId);
    await expect(targetRowCellsMap["End Customer"]).toContain(testQuote.endCustomer);
    await expect(targetRowCellsMap["Reseller Price"]).toContain(testQuote.resellerPrice);
    await expect(targetRowCellsMap["Retail Price"]).toContain(testQuote.retailPrice);
});

test('User is able to search Quotes on contract details page', async ({ commonPageCP }) => {
    let tableElement=await commonPageCP.getTable();
    await tableElement.searchAndOpen(testContract.contractNumber);
    await commonPageCP.openTab("Quotes")
    let assetsTable=await commonPageCP.getTable();
    await assetsTable.search(testQuote.quoteNo);
    await sleep(1)
    let nameColumn=await assetsTable.getTableColumn("Quote Number")
    expect(nameColumn.join(",")).toContain(nameColumn.filter((t)=>t.includes(testQuote.quoteNo)).join(","))
});

[{ columnName: "Quote Number" },
   { columnName: "Reseller Price" },
].forEach(({columnName}) => {
    test(`User is able to sort Quotes on contract details by ${columnName}`, async ({ commonPageCP }) => {
            let tableElement=await commonPageCP.getTable();
            await tableElement.searchAndOpen(TestData.defaultQWCContract.contractNumber);
            await commonPageCP.openTab("Quotes")
            await commonPageCP.waitForLoading()
            tableElement = await commonPageCP.getTable();
            await (await tableElement.getTableColumnElement(columnName)).click()
            await commonPageCP.waitForLoading()
            let origOrder= (await tableElement.getTableColumn(columnName))
            if (columnName.includes("Price")){
                origOrder=origOrder.map((t)=>t.replace("\xa0"," ").split(" ")[0].replace(".","").replace(",","."))
            }
            let actualOrderString=origOrder.join(",");
            let expectedOrderString=await commonHelper.verifySorting(origOrder,columnName,"asc");
            expect(actualOrderString).toEqual(expectedOrderString);
            await (await tableElement.getTableColumnElement(columnName)).click()
            await sleep(1)
            origOrder= (await tableElement.getTableColumn(columnName))
            if (columnName.includes("Price")){
                origOrder=origOrder.map((t)=>t.replace("\xa0"," ").split(" ")[0].replace(".","").replace(",","."))
            }
            actualOrderString=origOrder.join(",");
            expectedOrderString=await commonHelper.verifySorting(origOrder,columnName,"desc");
            expect(actualOrderString).toEqual(expectedOrderString);
    });
});


test('User is able to filter Quotes on contract details by Status', async ({ commonPageCP }) => {
    let tableElement=await commonPageCP.getTable();
    await tableElement.searchAndOpen(TestData.defaultQWCContract.contractNumber);
    await commonPageCP.openTab("Quotes")
    await commonPageCP.setStatusFilters(["Lost"])
    await sleep(2)
    let tableText=await tableElement.getBodyAsText();
    if (tableText!=="No results."){
        let quoteStatuses=await tableElement.getTableColumn("Status")
        expect([...new Set(quoteStatuses)].toString()).toEqual(`Lost`);
    }
});

test('User is able to request quote from contract details page', async ({commonPageCP, contractDetailsPageCP }) => {
    test.setTimeout(60_000);

    let testQuoteRequest={
        "requestQuoteForContractGroup":false,
        "generalRequest":"Request test",
        "files":[
            "src/tests/testfile.csv",
            "src/tests/poFile.pdf",
        ]
    }
    let tableElement=await commonPageCP.getTable();
    await tableElement.searchAndOpen(testContract.contractNumber);
    let fd_ticket=(await freshdeskHelper.search_recent_ticket("type:'New Business'")).results;
    let quoteRequestFromContractDialog=await contractDetailsPageCP.openRequestChangeDialog();
    await quoteRequestFromContractDialog.fillQuoteDetails(testQuoteRequest)
    await quoteRequestFromContractDialog.clickButton("Submit")
    await contractDetailsPageCP.waitForNotification("Your quote has been requested successfully");
    let new_item_id=await freshdeskHelper.wait_for_new_ticket("type:'New Business'",fd_ticket)
    let fd_ticket_details= await freshdeskHelper.get_ticket_details( new_item_id);
    try {
        expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*End Customer.*${testContract.endCustomer}.*`, "s"));
        expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Contract Number.*${testContract.contractNumber}.*`, "s"));
        expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Group ID.*${testContract.groupId}.*`, "s"));
        expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Quote all contracts in grou.*No.*`, "s"));
        expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Comment.*Request.*test.*`, "s"));

        let details = fd_ticket_details["attachments"][0]
        await commonHelper.downloadFile(details["attachment_url"], details["name"])
        expect(await fs.readFileSync(details["name"]).toString() == await fs.readFileSync("src/tests/testfile.csv").toString(), `Files ${details["name"]} and "src/tests/testfile.csv" are not the same`).toBe(true)
        details = fd_ticket_details["attachments"][1]
        await commonHelper.downloadFile(details["attachment_url"], details["name"])
        expect(await fs.readFileSync(details["name"]).toString() == await fs.readFileSync("src/tests/poFile.pdf").toString(), `Files ${details["name"]} and "src/tests/poFile.pdf" are not the same`).toBe(true)
    }
    catch (e){throw e;}
    finally {
        if (fd_ticket_details.id !== undefined) {
            await freshdeskHelper.delete_ticket(fd_ticket_details.id);
        }
    }
});

test.skip('User is able to open PDF preview for contract', async () => {
    test.skip(true,"Playwright does not render PDF in UI tests. Use API tests instead");
});