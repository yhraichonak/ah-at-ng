import ahAPI from "../../api/SupertestAHAPIHelper";
import TestData from "../testdata";
import {test,expect} from "@jest/globals";
import {sleep} from "../../api/utils";
import * as allure from "allure-js-commons";
let spToDel="ATSP_QUOTE_TO_DELETE";
import ahDbHelper from "../../api/AHDBHelper";
let quoteToDelete
let defaultSPPayload={
         "inputs": [
             {
                 "packNo": `${spToDel}_0001`,
                 "serialNumber": "",
                 "productSku": "",
                 "customerId": TestData.defaultCustomerDetails.id,
                 "contactId": TestData.defaultCustomerContact.id,
                 "resellerId": TestData.altOrganizationEntityDetails.id
             }
]};

describe("[jest] Service Packs - Quotes", () => {
    afterEach(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        await  ahAPI.deleteServicePacksByQuery(ahAPI.COMMON_TOKEN, spToDel,TestData.altOrgId )
        await ahAPI.clearCommonSession();
        if (quoteToDelete!==undefined){
            await  ahDbHelper.removeQuote(quoteToDelete.id)
            quoteToDelete=undefined
        }
    });

    beforeAll(async () => {
        await ahAPI.getCommonSessionForSA();
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        await  ahAPI.deleteServicePacksByQuery(ahAPI.COMMON_TOKEN, spToDel,TestData.altOrgId)
    });

    afterAll(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        await  ahAPI.deleteServicePacksByQuery(ahAPI.COMMON_TOKEN, spToDel,TestData.altOrgId )
        await ahAPI.clearCommonSession();
    });

    beforeEach(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
    });


    test.each([
         {sp: TestData.sp_mock_data["MOCK-EXPIRED-RECENT"], descr:"Recently Expired (-30 days)", rprice:705.5 , price:850 },
         {sp: TestData.sp_mock_data["MOCK-EXPIRING-SOON"], descr:"Expiring Soon (+5 days)", rprice:996 , price:1200 },
         {sp: TestData.sp_mock_data["MOCK-EXPIRING-MEDIUM"], descr:"Expiring Medium (+30 days)" , rprice:788.5 , price:950},
    ])
    ("Generate Service Pack Quotes - $descr", async ({descr, sp,rprice, price}) => {
         let payload={...defaultSPPayload}
        payload.inputs[0]["serialNumber"]=sp["sn"]
        payload.inputs[0]["productSku"]=sp["productSKU"]
        let initialQuotes =(await ahAPI.getQuotes(ahAPI.COMMON_TOKEN,TestData.altOrgId, "?sortBy=quoteNo&sortOrder=desc&type[]=SERVICE PACK")).body.data.map(t=>t.id);
        let response =await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN,defaultSPPayload, TestData.altOrgId);
        expect(response.statusCode).toBe(201);
        let newQuote=await ahAPI.waitForNewQuote(ahAPI.COMMON_TOKEN,TestData.altOrgId, "?sortBy=quoteNo&sortOrder=desc&type[]=SERVICE PACK",initialQuotes);
        quoteToDelete=newQuote
        expect(newQuote.endUser.id).toBe(payload.inputs[0].customerId)
        expect(newQuote.uiStatus).toBe("Open")
        expect(newQuote.resellerTotalPrice).toBe(rprice)
        expect(newQuote.endCustomerTotalPrice).toBe(price)
    });

    test("Generate Service Pack Quotes - Expired Boundary (-45 days)", async () => {
        let sp=TestData.sp_mock_data["MOCK-EXPIRED-BOUNDARY"]
        let rPrice=664
        let ecPrice=800
        let payload={...defaultSPPayload}
        payload.inputs[0]["serialNumber"]=sp["sn"]
        payload.inputs[0]["productSku"]=sp["productSKU"]
        let resp =(await ahAPI.getQuotes(ahAPI.COMMON_TOKEN,TestData.altOrgId, "?sortBy=quoteNo&sortOrder=desc&type[]=SERVICE PACK"))
        let initialQuotes =resp.body.data.map(t=>t.quoteNo);
        let response =await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN,defaultSPPayload, TestData.altOrgId);
        expect(response.statusCode).toBe(201);
        let newQuote=await ahAPI.waitForNewQuote(ahAPI.COMMON_TOKEN,TestData.altOrgId, "?sortBy=quoteNo&sortOrder=desc&type[]=SERVICE PACK",initialQuotes);
        quoteToDelete=newQuote
        expect(newQuote.endUser.id).toBe(payload.inputs[0].customerId)
        expect(newQuote.uiStatus).toBe("Open")
        expect(newQuote.resellerTotalPrice).toBe(rPrice)
        expect(newQuote.endCustomerTotalPrice).toBe(ecPrice)
    });

    test("Not generate Service Pack Quotes - Old Expired (-60 days)", async () => {
        let sp= TestData.sp_mock_data["MOCK-EXPIRED-OLD"]
        let payload={...defaultSPPayload}
        payload.inputs[0]["serialNumber"]=sp["sn"]
        payload.inputs[0]["productSku"]=sp["productSKU"]
        let initialQuotes =((await ahAPI.getQuotes(ahAPI.COMMON_TOKEN,TestData.altOrgId, "?sortBy=quoteNo&sortOrder=desc&type[]=SERVICE PACK")).body.data.map(t=>t.quoteNo)).toString();
        let response =await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN,defaultSPPayload, TestData.altOrgId);
        expect(response.statusCode).toBe(201);
        let newQuotes =((await ahAPI.getQuotes(ahAPI.COMMON_TOKEN,TestData.altOrgId, "?sortBy=quoteNo&sortOrder=desc&type[]=SERVICE PACK")).body.data.map(t=>t.quoteNo)).toString();
        expect(initialQuotes==newQuotes)
    });

    test("Not generate Service Pack Quotes - Active Future (+90 days)", async () => {
        let sp= TestData.sp_mock_data["MOCK-ACTIVE-FUTURE"];
        let payload={...defaultSPPayload}
        payload.inputs[0]["serialNumber"]=sp["sn"]
        payload.inputs[0]["productSku"]=sp["productSKU"]
        let initialQuotes =(await ahAPI.getQuotes(ahAPI.COMMON_TOKEN,TestData.altOrgId, "?sortBy=quoteNo&sortOrder=desc&type[]=SERVICE PACK")).body.data.map(t=>t.quoteNo);
        let response =await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN,defaultSPPayload, TestData.altOrgId);
        expect(response.statusCode).toBe(201);
        await sleep(1)
        let newQuotes =(await ahAPI.getQuotes(ahAPI.COMMON_TOKEN,TestData.altOrgId, "?sortBy=quoteNo&sortOrder=desc&type[]=SERVICE PACK")).body.data.map(t=>t.quoteNo);
        expect(initialQuotes.toString()).toContain(newQuotes.toString())
    });


    test("Not generate Service Pack Quotes - Unknown status", async () => {
        let sp= TestData.sp_mock_data["MOCK-UNKNOWN-STATUS"]
        let payload={...defaultSPPayload}
        payload.inputs[0]["serialNumber"]=sp["sn"]
        payload.inputs[0]["productSku"]=sp["productSKU"]
        let response =await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN,defaultSPPayload, TestData.altOrgId);
        expect(response.statusCode).toBe(500);
    });
});

