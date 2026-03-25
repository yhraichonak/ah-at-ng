import { expect } from '@playwright/test';
import { test } from '../uifixtures/resource.fixture';
import TestData from "../tests/testdata";
import {TableComponent} from "../uipom/table_component";
import freshdeskHelper from "../api/FreshdeskHelper";
import ahDbHelper from "../api/AHDBHelper";
import {init_content_persistent_browser, try_process_relogin} from "./utils";
import {sleep} from "../api/utils";
import commonHelper from "../api/CommonHelper";
import fs from "fs";
import ahAPI from "../api/SupertestAHAPIHelper";


const REQUEST_CHANGE_EDIT_ITEMS = [
    { serialNumber: "RFANUA7TH3608N", name:"HPE 64GB 4Rx4 PC4-2400T-L Kit", serviceGroup: "HPE Tech Care Basic SVC", serviceGroupSKU: "HU4B2AC" },
    { serialNumber: "RFANUA7TH360AX", name:"HPE 64GB 4Rx4 PC4-2400T-L Kit", serviceGroup: "HPE Tech Care Basic SVC", serviceGroupSKU: "HU4B2AC" },
];
const REQUEST_CHANGE_DELETE_ITEMS = [{ serialNumber: "RFANUA7TH3608M", name: "HPE 64GB 4Rx4 PC4-2400T-L Kit",serviceGroup: "HPE Tech Care Basic SVC", serviceGroupSKU:"HU4B2AC" },];
const SERVICE_GROUP = { name: "HPE Tech Care Critical SVC (HU4A3AC)", sku: "HU4A3AC"};
test.setTimeout(50000);
test.beforeAll(async ({},testInfo) => {
    test.setTimeout(60_000);
    await init_content_persistent_browser(testInfo, TestData.altOrganization)
})

test.beforeEach(async ({loginPageCP, quotesPageCP}) => {
    await quotesPageCP.navigate()
    await  sleep(1);
});

test.afterEach(async ({cpPage,loginPageCP, dashboardPageCP}) => {
    await try_process_relogin(cpPage,loginPageCP,dashboardPageCP)
    await cpPage.context().close()
});

test('User is able to request changes for quote', async ({ commonPageCP, quoteDetailsPageCP }) => {
    test.setTimeout(60_000);
    await ahDbHelper.set_quote_status(TestData.defaultQuote.quoteNumber, "Open")
    let ffname="new_quote_change_request_flow"
    let orig_ff=await ahDbHelper.get_ff(ffname)
    if (orig_ff.enabled==true) {
        await ahDbHelper.disable_ff(ffname)
        await commonPageCP.refresh();
        await sleep(2)
    }
    try {
        let tableElement = await commonPageCP.getTable();
        await tableElement.search(TestData.defaultQuote.quoteNumber);
        await tableElement.open(TestData.defaultQuote.quoteNumber);
        await commonPageCP.clickButton("Request Change");
        let requestChangeDialog = await quoteDetailsPageCP.getRequestChangeDialog()
        await requestChangeDialog.setServiceGroup([REQUEST_CHANGE_EDIT_ITEMS[0].serialNumber, REQUEST_CHANGE_EDIT_ITEMS[1].serialNumber], SERVICE_GROUP.name);
        await requestChangeDialog.deleteItems([REQUEST_CHANGE_DELETE_ITEMS[0].serialNumber])
        await requestChangeDialog.clickButton("Continue");
        await requestChangeDialog.fillCancellationReason("Other");
        await requestChangeDialog.clickButton("Continue");
        await requestChangeDialog.fillComment("My Custom Comment");
        await requestChangeDialog.clickButton("Continue");
        tableElement = await new TableComponent(await requestChangeDialog.getConfirmationDataSection("Cancelled Rows"));
        let targetRowCellsMap = await tableElement.findRowAsMap(REQUEST_CHANGE_DELETE_ITEMS[0].name)
        await expect(targetRowCellsMap["Name"]).toContain(REQUEST_CHANGE_DELETE_ITEMS[0].name);
        await expect(targetRowCellsMap["Service Group"]).toContain(REQUEST_CHANGE_DELETE_ITEMS[0].serviceGroup);
        await expect(targetRowCellsMap["Service Group SKU"]).toContain(REQUEST_CHANGE_DELETE_ITEMS[0].serviceGroupSKU);
        tableElement = await new TableComponent(await requestChangeDialog.getConfirmationDataSection("Changed Rows"));
        targetRowCellsMap = await tableElement.findRowAsMap(REQUEST_CHANGE_EDIT_ITEMS[0].serialNumber)
        await expect(targetRowCellsMap["Name"]).toContain(REQUEST_CHANGE_EDIT_ITEMS[0].name);
        await expect(targetRowCellsMap["Serial Number"]).toContain(REQUEST_CHANGE_EDIT_ITEMS[0].serialNumber);
        await expect(targetRowCellsMap["Previous Service Group"]).toContain(REQUEST_CHANGE_EDIT_ITEMS[0].serviceGroup);
        await expect(targetRowCellsMap["Previous SKU"]).toContain(REQUEST_CHANGE_EDIT_ITEMS[0].serviceGroupSKU);
        await expect(targetRowCellsMap["New Service Group"]).toContain(SERVICE_GROUP.name.split(" (")[0]);
        await expect(targetRowCellsMap["New SKU"]).toContain(SERVICE_GROUP.sku);
        targetRowCellsMap = await tableElement.findRowAsMap(REQUEST_CHANGE_EDIT_ITEMS[1].serialNumber)
        await expect(targetRowCellsMap["Name"]).toContain(REQUEST_CHANGE_EDIT_ITEMS[1].name);
        await expect(targetRowCellsMap["Serial Number"]).toContain(REQUEST_CHANGE_EDIT_ITEMS[1].serialNumber);
        await expect(targetRowCellsMap["Previous Service Group"]).toContain(REQUEST_CHANGE_EDIT_ITEMS[1].serviceGroup);
        await expect(targetRowCellsMap["Previous SKU"]).toContain(REQUEST_CHANGE_EDIT_ITEMS[1].serviceGroupSKU);
        await expect(targetRowCellsMap["New Service Group"]).toContain(SERVICE_GROUP.name.split(" (")[0]);
        await expect(targetRowCellsMap["New SKU"]).toContain(SERVICE_GROUP.sku);
        let section = await requestChangeDialog.getConfirmationDataSection("Comment");
        await expect(await section.textContent()).toMatch(new RegExp("My.Custom.Comment"));
        let fd_ticket = (await freshdeskHelper.search_recent_ticket("type:'Quote change'")).results;
        await requestChangeDialog.clickButton("Submit");
        await commonPageCP.waitForNotification("Your change request has been successfully submitted.");
        let new_item_id = await freshdeskHelper.wait_for_new_ticket("type:'Quote change'", fd_ticket)
        let fd_ticket_details = await freshdeskHelper.get_ticket_details(new_item_id);
        expect(fd_ticket_details.description_text).toMatch(/.*The following changes have been requested*/s);
        expect(fd_ticket_details.description_text).toMatch(/.*General Request.*My.Custom.Comment.*/s);
        expect(fd_ticket_details.description_text).toMatch(/.*Service Group Changes.*/s);
        expect(fd_ticket_details.description_text).toMatch(/.*RFANUA7TH3608N.*805358-B21.*HPE 64GB 4Rx4 PC4-2400T-L Kit.*HPE Tech Care Critical SVC.*HU4A3AC.*HPE Tech Care Basic SVC.*HU4B2AC.*/s);
        expect(fd_ticket_details.description_text).toMatch(/.*RFANUA7TH360AX.*805358-B21.*HPE 64GB 4Rx4 PC4-2400T-L Kit.*HPE Tech Care Critical SVC.*HU4A3AC.*HPE Tech Care Basic SVC.*HU4B2AC.*/s);
        expect(fd_ticket_details.description_text).toMatch(/.*Cancellation.*RFANUA7TH3608M.*805358-B21.*HPE 64GB 4Rx4 PC4-2400T-L Kit.*/s);
        expect(fd_ticket_details.description_text).toMatch(/.*Cancellation Reason.*Other.*/s);
        await freshdeskHelper.delete_ticket(new_item_id);
    }
    catch (e){throw e;} finally {
        if (orig_ff.enabled==false) { await ahDbHelper.enable_ff(ffname)}
    }
});


test('User is able to request quote', async ({quotesPageCP }) => {
    test.setTimeout(70000);
    let fd_ticket=(await freshdeskHelper.search_recent_ticket("type:'New Business'")).results;
    let quoteRequestDialog=await quotesPageCP.openQuoteRequestForm();
    await quoteRequestDialog.fillQuoteDetails(TestData.testQuoteRequest)
    await quoteRequestDialog.clickButton("Submit")
    await quotesPageCP.waitForNotification("Your quote has been requested successfully");
    let new_item_id=await freshdeskHelper.wait_for_new_ticket("type:'New Business'",fd_ticket)
    let fd_ticket_details= await freshdeskHelper.get_ticket_details( new_item_id);
    expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*End Customer.*${TestData.defaultEndUserDetails.name}.*`,'s'));
    expect(fd_ticket_details.description_text).toMatch(/.*11111.*2222.*HPE Foundation Care 24x7 Service.*H7J34AC.*/s);
    expect(fd_ticket_details.description_text).toMatch(/.*33333.*4444.*HPE Foundation Care 24x7 Service.*H7J34AC.*/s);
    expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Comment.*Test.*message.*`,'s'));
    let details=fd_ticket_details["attachments"][0]
    await commonHelper.downloadFile(details["attachment_url"],details["name"])
    expect(await fs.readFileSync(details["name"]).toString()==await fs.readFileSync("src/tests/poFile.pdf").toString(),`Files ${details["name"]} and "src/tests/poFile.pdf" are not the same`).toBe(true)
    await freshdeskHelper.delete_ticket( new_item_id);
});

test('User is able to Approve quote', async ({ commonPageCP, quoteDetailsPageCP }) => {
    test.setTimeout(60_000);
    await ahDbHelper.set_quote_status(TestData.openQuote.quoteNumber, "Open")
    let tableElement=await commonPageCP.getTable();
    await tableElement.search(TestData.openQuote.quoteNumber);
    await tableElement.open(TestData.openQuote.quoteNumber);
    await commonPageCP.clickButton("Approve");
    let approveQuoteDialog=await quoteDetailsPageCP.getApproveQuoteDialog()
    await approveQuoteDialog.fillPoNumber("PO9999")
    await approveQuoteDialog.fillComment("Approve comment")
    await approveQuoteDialog.AttachPO("src/tests/poFile.pdf")
    let fd_ticket=(await freshdeskHelper.search_recent_ticket("type:'Approved'")).results;
    await approveQuoteDialog.clickButton("Submit");
    await commonPageCP.waitForNotification("Quote has been sent to approve");
    let new_item_id=await freshdeskHelper.wait_for_new_ticket("type:'Approved'",fd_ticket,15)
    let fd_ticket_details= await freshdeskHelper.get_ticket_details( new_item_id);
    expect(fd_ticket_details.description_text).toMatch(new RegExp(".*The quote CH21580 was approved.*Reseller.Price.*CHF.1,772.35.*Number.*PO9999.*Comment.*Approve.*comment.*","s"));
    await freshdeskHelper.delete_ticket( new_item_id);
});

test('User is able to Decline quote', async ({ commonPageCP, quoteDetailsPageCP }) => {
    test.setTimeout(60_000);
    await ahDbHelper.set_quote_status(TestData.openQuote.quoteNumber, "Open")
    let tableElement=await commonPageCP.getTable();
    await tableElement.searchAndOpen(TestData.openQuote.quoteNumber);
    await commonPageCP.clickButton("Decline");
    let declineQuoteDialog=await quoteDetailsPageCP.getDeclineDialog()
    await declineQuoteDialog.fillReason("No response")
    let fd_ticket=(await freshdeskHelper.search_recent_ticket("type:'Declined'")).results;
    await declineQuoteDialog.clickButton("Submit");
    await commonPageCP.waitForNotification("Quote has been declined");
    let new_item_id=await freshdeskHelper.wait_for_new_ticket("type:'Declined'",fd_ticket)
    let fd_ticket_details= await freshdeskHelper.get_ticket_details( new_item_id);
    expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*The quote ${TestData.openQuote.quoteNumber} was declined.*Decline Reason.*No response.*`,"s"));
    await freshdeskHelper.delete_ticket( new_item_id);
});


test('User is able to Approve Service Pack quote with default SP', async ({ commonPageCP, spQuotePageCP }) => {
    test.setTimeout(80_000);
    await ahDbHelper.set_quote_status(TestData.altSPQuote.quoteNo, "Open")
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails)
    await ahAPI.updateServicePackQuote(ahAPI.COMMON_TOKEN,TestData.altServicePack.id, TestData.altSPQuote.id,TestData.altSgAltDetailsFull, TestData.altOrgId);
    let fd_ticket=(await freshdeskHelper.search_recent_ticket("type:'Approved'")).results;
    let tableElement=await commonPageCP.getTable();
    await tableElement.search(TestData.altSPQuote.quoteNo);
    await tableElement.open(TestData.altSPQuote.quoteNo);
    await commonPageCP.clickButton("Next");
    await  sleep(2)
    await commonPageCP.waitForLoading()
    let pageText= await commonPageCP.getTextContent();
    expect(pageText).toMatch(/.*HPE 1 Year Post Warranty Tech Care Basic wDMR DL360 Gen10 Service.*Basic.*/);
    expect(pageText).toMatch(/.*SKU.*HS7W5PE.*Duration.*1 year.*/);
    expect(pageText).toMatch(/.*Linked Hardware.*/);
    expect(pageText).toMatch(/.*HPE DL360 Gen10 4208 1P 16G NC 8SFF Svr.*/);
    expect(pageText).toMatch(/.*Serial Number: CZJ105018J.*SKU: P19774-B21*/);
    expect(pageText).toMatch(/.*Order Summary.*/);
    expect(pageText).toMatch(/.*List Price.*1,285.*/);
    expect(pageText).toMatch(/.*Discount.*17%.*218.45.*/);
    expect(pageText).toMatch(/.*Subtotal.*excl.*VAT.*1,066.55.*/);
    expect(pageText).toMatch(/.*VAT.*0%.*86.39.*/);
    expect(pageText).toMatch(/.*Total.*1,152.94.*/);
    expect(pageText).toMatch(new RegExp(".*Pricing valid until 03/31/2026.*","s"));
    await spQuotePageCP.fillDetails("PO9999","src/tests/poFile.pdf",true)
    await commonPageCP.clickButton("Purchase");
    await commonPageCP.page.waitForURL("**/ordered");
    await commonPageCP.waitForLoading();
    await  sleep(1)
    pageText= await commonPageCP.getTextContent();
    expect(pageText).toMatch(/.*Order Confirmed!.*/);
    expect(pageText).toMatch(/.*Order Number.*ALT-SP-QUOTE.*/);
    expect(pageText).toMatch(/.*Service Pack Name.*HPE 1 Year Post Warranty Tech Care Basic wDMR DL360 Gen10 Service.*Y1.*/);
    expect(pageText).toMatch(/.*Service Pack SKU.*HS7W5PE.*/);
    expect(pageText).toMatch(/.*Product Name.*HPE DL360 Gen10 4208 1P 16G NC 8SFF Svr.*/);
    expect(pageText).toMatch(/.*Product SKU.*P19774-B21.*/);
    expect(pageText).toMatch(/.*Product Serial Number.*CZJ105018J.*/);
    expect(pageText).toMatch(/.*Subtotal.*excl.*VAT.*1,066.55.*/);
    expect(pageText).toMatch(/.*VAT.*0%.*86.39.*/);
    expect(pageText).toMatch(/.*Total.*1,152.94.*/);
    let new_item_id=await freshdeskHelper.wait_for_new_ticket("type:'Approved'",fd_ticket)
    let fd_ticket_details= await freshdeskHelper.get_ticket_details( new_item_id);
    expect(fd_ticket_details.description_text).toMatch(new RegExp(".*The quote ALT-SP-QUOTE was approved for the service pack ALT-SP.*","s"));
    expect(fd_ticket_details.description_text).toMatch(new RegExp(".*Reseller Price:.*CHF.*1,066.55.*","s"));
    expect(fd_ticket_details.description_text).toMatch(new RegExp(".*PO.Number:.*PO9999.*","s"));
    expect(fd_ticket_details.description_text).toMatch(new RegExp(".*Legal Agreement Version:.*1b3847ee-25ae-4a3d-ac0b-1ade2232edea.*","s"));
    expect(fd_ticket_details.description_text).toMatch(new RegExp(".*HPE DL360 Gen10 4208 1P 16G NC 8SFF Svr.*P19774-B21.*CZJ105018J.*HPE 1 Year Post Warranty Tech Care Basic wDMR DL360 Gen10 Service.*HS7W5PE.*","s"));
    await freshdeskHelper.delete_ticket( new_item_id);
})

test('User is able to Approve Service Pack quote with alternative SP', async ({ commonPageCP, spQuotePageCP }) => {
    try {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        test.setTimeout(80_000);
        let fd_ticket = (await freshdeskHelper.search_recent_ticket("type:'Approved'")).results;
        await ahDbHelper.set_quote_status(TestData.altSPQuote.quoteNo, "Open")
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails)
        await ahAPI.updateServicePackQuote(ahAPI.COMMON_TOKEN,TestData.altServicePack.id, TestData.altSPQuote.id,TestData.altSgAltDetailsFull, TestData.altOrgId);
        let tableElement = await commonPageCP.getTable();
        await tableElement.search(TestData.altSPQuote.quoteNo);
        await tableElement.open(TestData.altSPQuote.quoteNo);
        await spQuotePageCP.selectServicePack("HPE 2 Year Post Warranty Tech Care Basic DL360 Gen10 Service")
        await commonPageCP.clickButton("Next");
        await sleep(2)
        await commonPageCP.waitForLoading()
        let pageText = await commonPageCP.getTextContent();
        expect(pageText).toMatch(/.*HPE 2 Year Post Warranty Tech Care Basic DL360 Gen10 Service.*Basic.*/);
        expect(pageText).toMatch(/.*SKU.*HS7W1PE.*Duration.*2 year.*/);
        expect(pageText).toMatch(/.*Linked Hardware.*/);
        expect(pageText).toMatch(/.*HPE DL360 Gen10 4208 1P 16G NC 8SFF Svr*/);
        expect(pageText).toMatch(/.*Serial Number: CZJ105018J.*SKU: P19774-B21*/);
        expect(pageText).toMatch(/.*Order Summary.*/);
        expect(pageText).toMatch(/.*List Price.*2,309.*/);
        expect(pageText).toMatch(/.*Discount.*17%.*392.53.*/);
        expect(pageText).toMatch(/.*Subtotal.*excl.*VAT.*1,916.47.*/);
        expect(pageText).toMatch(/.*VAT.*0%.*155.23.*/);
        expect(pageText).toMatch(/.*Total.*2,071.70.*/);
        expect(pageText).toMatch(new RegExp(".*Pricing valid until 03/31/2026.*", "s"));
        await spQuotePageCP.fillDetails("PO9999", "src/tests/poFile.pdf", true)
        await commonPageCP.clickButton("Purchase");
        await commonPageCP.page.waitForURL("**/ordered");
        await commonPageCP.waitForLoading();
        await sleep(1)
        pageText = await commonPageCP.getTextContent();
        expect(pageText).toMatch(/.*Order Confirmed!.*/);
        expect(pageText).toMatch(/.*Order Number.*ALT-SP-QUOTE.*/);
        expect(pageText).toMatch(/.*Service Pack Name.*HPE 2 Year Post Warranty Tech Care Basic DL360 Gen10 Service.*Y2.*/);
        expect(pageText).toMatch(/.*Service Pack SKU.*HS7W1PE.*/);
        expect(pageText).toMatch(/.*Product Name.*HPE DL360 Gen10 4208 1P 16G NC 8SFF Svr.*/);
        expect(pageText).toMatch(/.*Product SKU.*P19774-B21.*/);
        expect(pageText).toMatch(/.*Product Serial Number.*CZJ105018J.*/);
        expect(pageText).toMatch(/.*Subtotal.*excl.*VAT.*1,916.47.*/);
        expect(pageText).toMatch(/.*VAT.*0%.*155.23.*/);
        expect(pageText).toMatch(/.*Total.*2,071.70.*/);
        let new_item_id = await freshdeskHelper.wait_for_new_ticket("type:'Approved'", fd_ticket)
        let fd_ticket_details = await freshdeskHelper.get_ticket_details(new_item_id);
        expect(fd_ticket_details.description_text).toMatch(new RegExp(".*The quote ALT-SP-QUOTE was approved for the service pack ALT-SP.*", "s"));
        expect(fd_ticket_details.description_text).toMatch(new RegExp(".*Reseller Price:.*CHF.*1,916.47.*", "s"));
        expect(fd_ticket_details.description_text).toMatch(new RegExp(".*PO.Number:.*PO9999.*", "s"));
        expect(fd_ticket_details.description_text).toMatch(new RegExp(".*Legal Agreement Version:.*1b3847ee-25ae-4a3d-ac0b-1ade2232edea.*", "s"));
        expect(fd_ticket_details.description_text).toMatch(new RegExp(".*HPE DL360 Gen10 4208 1P 16G NC 8SFF Svr.*P19774-B21.*CZJ105018J.*HPE 2 Year Post Warranty Tech Care Basic DL360 Gen10 Service.*HS7W1PE.*", "s"));
        await freshdeskHelper.delete_ticket( new_item_id);
    }catch (e){ throw e}
    finally{
        await ahDbHelper.set_quote_status(TestData.altSPQuote.quoteNo, "Open")
        await ahAPI.updateServicePackQuote(ahAPI.COMMON_TOKEN,TestData.defaultServicePack.id, TestData.altSPQuote.id,TestData.altSgAltDetailsFull, TestData.altOrgId);
    }
});

