import ahAPI from "../../api/SupertestAHAPIHelper";
import commonHelper from "../../api/CommonHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import {addDays,substractDays,sleep} from "../../api/utils";
const pdf = require('pdf-parse');
import { join } from "node:path";
import gmailHelper from "../../api/GmailHelper";
import fs from "fs";
import freshdeskHelper from "../../api/FreshdeskHelper";
import ahDBHelper from "../../api/AHDBHelper";
import * as allure from "allure-js-commons";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testContract=TestData.TEST_CONTRACT_MAP[TestData.TEST_DATA_MODE];
let altContractId="303ee3888e138af5"
let altContractIdDifferentGroup="25235550091c3c76"
describe('[jest] Contracts', () => {

    let createContractPayload={
        "contractNumber": "atc_001c",
        "groupId": "atg_001c",
        "sar": "sar_001c",
        "said": "Ssaid_001c",
        "startDate": "2025-09-01T21:59:59.999Z",
        "endDate": "2028-12-31T22:59:59.999Z",
        "vendorId": TestData.defaultDistributorVendorDetails.id,
        "distributorId":TestData.defaultContractCreateDistributorId,
        "endUserId": TestData.defaultCustomerDetails.id,
        "resellerId": TestData.defaultContractCreateReseller.id,
        "endCustomerPrice": "2000",
        "resellerPrice": "1000",
        "currency": "USD"
    }
    let importContractAsset1Details= {
            "serialNumber": "SN001",
            "name": "",
            "productSku": "H2522AU",
            "product": "[H2522AU] 1 Year Base PSS - NT",
            "serviceGroupSku": "HA124A1",
            "serviceGroup": "[HA124A1] HPE Technical Installation Startup SVC"
        }
    let importContractAsset2Details= {
        "serialNumber": "SN002",
        "name": "",
        "productSku": "H2522AU",
        "product": "[H2522AU] 1 Year Base PSS - NT",
        "serviceGroupSku": "HA124A1",
        "serviceGroup": "[HA124A1] HPE Technical Installation Startup SVC"
    }
    let importContractAssetsPayload={
        "contractId": "",
        "sar": createContractPayload.sar,
        "said": createContractPayload.said,
        "groupId": createContractPayload.groupId,
        "vendorId": createContractPayload.vendorId,
        "startDate": createContractPayload.startDate,
        "endDate": createContractPayload.endDate,
        "assets": [importContractAsset1Details,importContractAsset2Details],
    }

    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {
        await gmailHelper.authorize()
    })
    test("Get Contracts", async () => {
        let response =await ahAPI.getContracts(ahAPI.COMMON_TOKEN, TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/contracts'})
    })
    test("Get Contracts - Contract Info", async () => {
        let response =await ahAPI.getContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,"?search="+testContract["contractNumber"]);
        expect(response.statusCode).toBe(200);
        expect(response.body.data[0].id).toEqual(testContract["id"].toString());
        expect(response.body.data[0].contractNumber).toEqual(testContract["contractNumber"]);
        expect(response.body.data[0].status).toEqual((typeof testContract["status"] === "number")?
            TestData.STATUSES[testContract["status"]]:testContract["status"]);
        expect(response.body.data[0].groupId).toEqual(testContract["groupId"]);
        expect(response.body.data[0].startDate).toEqual(testContract["startDate"]);
        expect(response.body.data[0].endDate).toEqual(testContract["endDate"]);
        expect(response.body.data[0].sar).toEqual(testContract["sar"]);
    })

    test("Get Contracts - Pagination - Default", async () => {
        let response =await ahAPI.getContractsWithParams(ahAPI.COMMON_TOKEN,"","","","",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(50)
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    })

    test.each([
        { attr:"contractNumber",order:"asc" },
        { attr:"contractNumber",order:"desc" },
        { attr:"sar",order:"asc" },
        { attr:"sar",order:"desc" },
        { attr:"uiStatus",order:"asc" },
        { attr:"uiStatus",order:"desc" },
        { attr:"groupId",order:"asc" },
        { attr:"groupId",order:"desc" },
        { attr:"startDate",order:"asc" },
        { attr:"startDate",order:"desc" },
        { attr:"endDate",order:"asc" },
        { attr:"endDate",order:"desc" },
        { attr:"resellerTotalPrice",order:"asc" },
        { attr:"resellerTotalPrice",order:"desc" },
        { attr:"endUser",order:"asc" },
        { attr:"endUser",order:"desc" },
        { attr:"isQuoted",order:"asc" },
        { attr:"isQuoted",order:"desc" }
    ])

    (`Get Contract - Sorting by $attr in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,`?sortBy=${attr}&sortOrder=${order}`);
        if (response.status!==200){
            throw Error(`Unexpected error returned while sorting ${response.status} - ${response.body.message}`)
        }
        let origOrder:[]= response.body.data.map(t=>( t[attr]?.name!==undefined)?t[attr].name:t[attr]);
        let actualOrderString=origOrder.filter((s)=>s !==null && s !==undefined).join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder.filter((s)=>s !==null && s !==undefined  ),attr,order,false);
        expect(actualOrderString).toEqual(expectedOrderString);
    })

    test("Get Contracts - Pagination - 100 pages", async () => {
        let response =await ahAPI.getContractsWithParams(ahAPI.COMMON_TOKEN,"100","","","",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(100)
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    })

    test("Get Contracts - Pagination - Cursor", async () => {
        let entities20 =(await ahAPI.getContractsWithParams(ahAPI.COMMON_TOKEN,"20","","","",TestData.defaultOrgId)).body.data;
        let response=await ahAPI.getContractsWithParams(ahAPI.COMMON_TOKEN,"10","","","",TestData.defaultOrgId);
        let nextCursor=response.body.meta.nextCursor
        let first10 =response.body.data;
        let last10 =(await ahAPI.getContractsWithParams(ahAPI.COMMON_TOKEN,"10",nextCursor,"","",TestData.defaultOrgId)).body.data;
        expect(entities20.map(u=>u.id).join(",")).toContain(first10.map(u=>u.id).join(","));
        expect(entities20.map(u=>u.id).join(",")).toContain((last10.map(u=>u.id)).join(","));
    })

    test("Get Contracts - Pagination - Non-Existing cursor", async () => {
        let response =(await ahAPI.getContractsWithParams(ahAPI.COMMON_TOKEN,"10","CH99999","","",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBeLessThanOrEqual(10)
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    })

    test.each([
        { attribute: "contractNumber", query: "6389" },
        { attribute: "groupId", query: "SMD501" },
        { attribute: "groupId", query: " 1686" },
        { attribute: "sar", query: "SCHWE403" }
    ])
    ("Get Contracts - Search - by $attribute", async ({attribute,query}) => {
        let response =(await ahAPI.getContractsWithParams(ahAPI.COMMON_TOKEN,"","",query,"",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u[attribute]).join(",")).toBe(response.body.data.filter(u=>u[attribute].includes(query)).map(u=>u[attribute]).join(","))
    })

    test("Get Contracts - Search without results", async () => {
        let response =(await ahAPI.getContractsWithParams(ahAPI.COMMON_TOKEN,"","","blah","",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data).toHaveLength(0)})

    test.each([{ status: "status[]=Renewed", statusString: "Renewed"  }])
    ("Get Contracts - Filter - Status", async ({status,statusString}) => {
        let response =(await ahAPI.getContractsWithParams(ahAPI.COMMON_TOKEN,"","","",status,TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(   response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u.status.startsWith(statusString)).map(u=>u.id).join(","))
    })

    test("Get Contracts - Filter - Multiple statuses", async () => {
        let response =(await ahAPI.getContractsWithParams(ahAPI.COMMON_TOKEN,"","","","status[]=Renewed&status[]=Expired",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u.status.match("(Renewed|Expired)")).map(u=>u.id).join(","))
    })

    test("Entities - Get Contracts - Filter - Status - Non-Exising", async () => {
        let response =(await ahAPI.getContractsWithParams(ahAPI.COMMON_TOKEN,"","","","status[]=BLAH",TestData.defaultOrgId));
        expect(response.statusCode).toBe(400)
        expect(response.body.message).toBe(`["status: Invalid input"]`);
    })

    test("Get Contracts - Filter - Vendor", async () => {
        let vendorName=TestData.defaultDistributorVendorDetails.name
        let response =await ahAPI.getContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, `?vendorNames[]=${vendorName}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u['vendor'].name.startsWith(vendorName)).map(u=>u.id).join(","))
    })

    test("Get Contracts - Filter - Multiple Vendors", async () => {
        let vendorName=TestData.defaultDistributorVendorDetails.name
        let vendor2Name=TestData.altVendorDetails.name
        let response =await ahAPI.getContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, `?vendorNames[]=${vendorName}&vendorNames[]=${vendor2Name}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u['vendor'].name.match(`(${vendorName}|${vendor2Name})`)).map(u=>u.id).join(","))
    })


    test("Get Contracts - Filter - Vendor - Non-matching", async () => {
        let response =await ahAPI.getContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, `?vendorNames[]=BLAH`);
        expect(response.body.data.length).toBe(0)
    })

    test.each([
        { remainingDays: 30 },
        { remainingDays: 60  },
        { remainingDays: 90 },
    ])("Get Contracts - Filter - Remaining Days - $remainingDays", async ({remainingDays}) => {
        const expectedExpirationDate = addDays(remainingDays);
        let response =await ahAPI.getContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, `?remainingDays[]=Expires in ${remainingDays} days`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>expectedExpirationDate>=new Date(u['endDate'])).map(u=>u.id).join(","))
    })

    test("{KNOWN ISSUE}: Get Contracts - Filter - Quoted", async () => {
        await allure.issue("AH-1548")
        let response =await ahAPI.getContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, `?isQuoted=true`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.length).toBe(response.body.data.filter(u=>u.isQuoted).length)
    })

   test("Get Contracts - Filter - End Date Before", async () => {
        const dateInFuture = addDays(90);
        let response =await ahAPI.getContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, `?endDateBefore=${dateInFuture.toISOString()}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>dateInFuture>=new Date(u['endDate'])).map(u=>u.id).join(","))
    })

    test("Get Contracts - Filter - End Date After", async () => {
        const dateInFuture = addDays(90);
        let response =await ahAPI.getContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, `?endDateAfter=${dateInFuture.toISOString()}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>dateInFuture<=new Date(u['endDate'])).map(u=>u.id).join(","))
    })

    test("Get Contracts - Filter - End Date - Between Dates", async () => {
        const dateInFutureStart = addDays(60);
        const dateInFutureEnd = addDays(90);
        let response =await ahAPI.getContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, `?endDateAfter=${dateInFutureStart.toISOString()}&endDateBefore=${dateInFutureEnd.toISOString()}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(","))
            .toBe(response.body.data.filter(u=>(dateInFutureStart<=new Date(u['endDate']))&&(new Date(u['endDate'])<=dateInFutureEnd)).map(u=>u.id).join(","))
    })

    test("Get Contracts - Filter - End Date - Between Past Dates", async () => {
        const dateInPastStart = substractDays(60);
        const dateInPastEnd = substractDays(30);
        let response =await ahAPI.getContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, `?endDateAfter=${dateInPastStart.toISOString()}&endDateBefore=${dateInPastEnd.toISOString()}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(","))
            .toBe(response.body.data.filter(u=>(dateInPastStart<=new Date(u['endDate']))&&(new Date(u['endDate'])<=dateInPastEnd)).map(u=>u.id).join(","))
    })

    test("Get Contracts - Filter - Remaining Days - Invalid", async () => {
        let response =await ahAPI.getContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId, `?remainingDays[]=Expires in blah days`);
        expect(response.statusCode).toBe(400)
        expect(response.body.message).toMatch(/Invalid input/)
    })


    test("Get Contracts - non-existing entity", async () => {
        let response =await ahAPI.getContracts(ahAPI.COMMON_TOKEN,TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    })

    test("Get Contracts - unauthorized", async () => {
        let response =await ahAPI.getContracts("blah",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Get Contract", async () => {
        let response =await ahAPI.getContract(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  testContract['id']);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/contract_details'})
    })

    test("Get Contract Details", async () => {
        let response =await ahAPI.getContract(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  testContract['id']);
        expect(response.body.id).toEqual(testContract["id"].toString());
        expect(response.body.contractNumber).toEqual(testContract["contractNumber"]);
        expect(response.body.status).toEqual((
            typeof testContract["status"] === "number")?
            TestData.STATUSES[testContract["status"]]:testContract["status"]);
        expect(response.body.endCustomerId).toEqual(testContract["endCustomerId"]);
        expect(response.body.vendorId).toEqual(testContract["vendorId"].toString());
        expect(response.body.resellerId).toEqual(testContract["resellerId"].toString());
        expect(response.body.distributorId).toEqual(testContract["distributorId"].toString());
        expect(response.body.startDate).toEqual(testContract["startDate"].toString());
        expect(response.body.endDate).toEqual(testContract["endDate"].toString());
    })

    test("Get Contract - Unauthorized", async () => {
        let response =await ahAPI.getContract("blah",TestData.defaultOrgId,  testContract['id']);
        expect(response.statusCode).toBe(401);
    })
    test("Get Contract - Invalid orgId", async () => {
        let response =await ahAPI.getContract(ahAPI.COMMON_TOKEN,TestData.nonExisingId,  testContract['id']);
        expect(response.statusCode).toBe(403);
        expect(response.body.message).toContain("Forbidden resource")
    })

    test("Get Contract - Invalid contractId", async () => {
        let response =await ahAPI.getContract(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,TestData.nonExisingId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(new RegExp(`${TestData.errorMessages['CONTRACT_NOT_FOUND']}`))
    })


    test("Get Contract - Batch Download - Multiple contracts from the same group", async () => {
        let contractIds=`${TestData.multicontractGroupContract1.id},${TestData.multicontractGroupContract2.id}`
        const textFromPDF =await ahAPI.downloadBatchContractPDFAndParse(ahAPI.COMMON_TOKEN,TestData.previewPDFOrgId,  contractIds,"?printName=Brutto Contract");
        expect(textFromPDF.text).toContain(TestData.multicontractGroupContract1.contractNumber);
        expect(textFromPDF.text).toContain(TestData.multicontractGroupContract2.contractNumber);
    },60000)

    test("Get Contract -  Batch Download - Multiple contracts from the different groups", async () => {
        let contractIds=`${TestData.multicontractGroupContract1.contractNumber},${TestData.multicontractGroupForeignContract1.contractNumber}`
        let response =await ahAPI.downloadBatchContractPDF(ahAPI.COMMON_TOKEN,TestData.previewPDFOrgId,  contractIds,"?printName=Brutto Contract");
        expect(response.statusCode).toBe(404);
    })

    test("Get Contract - Batch Download - With Prices", async () => {
        const textFromPDF=await ahAPI.downloadBatchContractPDFAndParse(ahAPI.COMMON_TOKEN,TestData.previewPDFOrgId,  TestData.contractWithPreview, "Brutto Contract");
        expect(textFromPDF.text).toContain(` 87-SMD500 1933C`);
        expect(textFromPDF.text).toContain(`10’023.48`);
    },60000)


    test("Get Contract - Batch Download - Without Prices", async () => {
        const textFromPDF =await ahAPI.downloadBatchContractPDFAndParse(ahAPI.COMMON_TOKEN,TestData.previewPDFOrgId,  TestData.contractWithPreview, "Brutto Contract No Pricing");
        expect(textFromPDF.text).toContain(`87-SMD500 1933C`);
        expect(textFromPDF.text).not.toContain(`10’023.48`);
    },60000)


    test("Get Contract - Batch Download - Unauthorized", async () => {
        let response =await ahAPI.downloadBatchContractPDF("BLAH",TestData.previewPDFOrgId,  TestData.contractWithPreview, "Brutto Contract No Pricing");
        expect(response.statusCode).toBe(401);
    })

    test("Get Contract - Batch Download - Unprivileged", async () => {
        let TOKEN= await ahAPI.getUserToken(TestData.restrictedUserDetails)
        let response =await ahAPI.downloadBatchContractPDF(TOKEN,TestData.previewPDFOrgId,  TestData.contractWithPreview, "Brutto Contract No Pricing");
        expect(response.statusCode).toBe(403);
    })

    test("Get Contract - Batch Download - Non-existing contract", async () => {
        let response =await ahAPI.downloadBatchContractPDF(ahAPI.COMMON_TOKEN,TestData.previewPDFOrgId,  TestData.nonExisingId, "Brutto Contract No Pricing");
        expect(response.statusCode).toBe(404);
    })

    test("Get Contract - PDF", async () => {
        let response =await ahAPI.getContractPDF(ahAPI.COMMON_TOKEN,TestData.previewPDFOrgId,  TestData.contractWithPreview);
        expect(response.statusCode).toBe(200);
    },20000)

    test("Get Contract - PDF - Info", async () => {
        let fileWithPDFContent='file.pdf'
        let response =await ahAPI.getContractPDF(ahAPI.COMMON_TOKEN,TestData.previewPDFOrgId,  TestData.contractWithPreview);
        expect(response.statusCode).toBe(200);
        await ahAPI.getPDFViaCURL(ahAPI.COMMON_TOKEN,TestData.previewPDFOrgId,  "contracts", TestData.contractWithPreview);
        let dataBuffer = await fs.readFileSync(join(process.cwd(), fileWithPDFContent));
        const textFromPDF = (await pdf(dataBuffer)).text;
        expect(textFromPDF).toContain(
            `Kundendienstvereinbarung
Vertragsgruppe: 87-SMD500 1933C
Vertrag (Expired)`);

    },20000)

    test("Get Contract - PDF - Unauthorized", async () => {
        let response =await ahAPI.getContractPDF("blah",TestData.defaultOrgId,  TestData.contractWithPreview);
        expect(response.statusCode).toBe(401);
    })

    test("Get Contract - PDF - non-existing contract", async () => {
        let response =await ahAPI.getContractPDF(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  TestData.nonExisingId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(new RegExp(`${TestData.errorMessages['CONTRACT_NOT_FOUND']}`))
    })


    test(" Request Quote for Contract", async () => {
        let fd_ticket=(await freshdeskHelper.search_recent_ticket("type:'New Business'")).results;
        let generalRequest= "AT General Request SINGLE";
        let quoteAllContractsInGroup= "Yes";
        let response =await ahAPI.requestQuoteForContract(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,
            testContract['id'],
            testContract['groupId'],
            testContract['customerId'],
            generalRequest,
            quoteAllContractsInGroup,
            "src/tests/poFile.pdf");
        expect(response.statusCode).toBe(200);
        let new_item_id=await freshdeskHelper.wait_for_new_ticket("type:'New Business'",fd_ticket,20,generalRequest)
        let fd_ticket_details= await freshdeskHelper.get_ticket_details( new_item_id);
        try {
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*End Customer.*${testContract.endCustomer}.*`, "s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Contract Number.*${testContract.id}.*`, "s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Group ID.*${testContract.groupId}.*`, "s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Quote all contracts in grou.*${quoteAllContractsInGroup}.*`, "s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Comment.*${generalRequest}.*`, "s"));

            let details = fd_ticket_details["attachments"][0]
            await commonHelper.downloadFile(details["attachment_url"], details["name"])
            expect(await fs.readFileSync(details["name"]).toString()).toMatch(await fs.readFileSync("src/tests/poFile.pdf").toString())

        }catch (e){throw e;} finally {
            if (fd_ticket_details.id !== undefined) {
                await freshdeskHelper.delete_ticket(fd_ticket_details.id);
            }
        }
    },50000)

    test(" Request Quote for Multiple Contracts", async () => {
        let fd_ticket=(await freshdeskHelper.search_recent_ticket("type:'New Business'")).results;
        let generalRequest= "AT General Request MULTI";
        let quoteAllContractsInGroup= "Yes";
        let response=await ahAPI.requestQuoteForMultipleContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,
            `${testContract['id']},${altContractId}`,
            testContract['groupId'],
            testContract['customerId'],
            generalRequest,
            quoteAllContractsInGroup,
            "src/tests/poFile.pdf");
        expect(response.statusCode).toBe(200);
        let new_item_id=await freshdeskHelper.wait_for_new_ticket("type:'New Business'",fd_ticket,20,generalRequest)
        let fd_ticket_details= await freshdeskHelper.get_ticket_details( new_item_id);
        try {
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*End Customer.*${testContract.endCustomer}.*`, "s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Contract Numbers.*${testContract['id']},${altContractId}.*`, "s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Group ID.*${testContract.groupId}.*`, "s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Quote all contracts in grou.*${quoteAllContractsInGroup}.*`, "s"));
            expect(fd_ticket_details.description_text).toMatch(new RegExp(`.*Comment.*${generalRequest}.*`, "s"));

            let details = fd_ticket_details["attachments"][0]
            await commonHelper.downloadFile(details["attachment_url"], details["name"])
            expect(await fs.readFileSync(details["name"]).toString()).toMatch(await fs.readFileSync("src/tests/poFile.pdf").toString())

        }catch (e){throw e;} finally {
            if (fd_ticket_details.id !== undefined) {
                await freshdeskHelper.delete_ticket(fd_ticket_details.id);
            }
        }
    },50000)

    test("Request Quote for Contract - Email", async () => {
        await ahAPI.postMe(ahAPI.COMMON_TOKEN, {firstName:TestData.defaultUserDetails.fname, lastName:TestData.defaultUserDetails.lname, "locale": "en"});
        await ahAPI.updateTestOrganization({"locale": "en"});
        let emailQuery=`to:tesedi.assethub.test+stg@gmail.com subject:Quote Request Confirmation – ${TestData.defaultCustomerDetails.name}. is:unread`
        await gmailHelper.readEmails(emailQuery)
        let generalRequest= "AT General Request";
        let quoteAllContractsInGroup= "Yes";
        await ahAPI.requestQuoteForContract(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,
            testContract['id'],
            testContract['groupId'],
            testContract['customerId'],
            generalRequest,
            quoteAllContractsInGroup,null);
        let quote_request_email_detail=await gmailHelper.waitForNewMessage(emailQuery)
        let quote_request_message= await gmailHelper.getPlainHTMLFromMessage(quote_request_email_detail,0)
        let email_body=quote_request_message.body.textContent
        expect(email_body).toMatch(new RegExp(`.*Your Request.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*End Customer.*${TestData.defaultCustomerDetails.name}.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Group ID.*${testContract['groupId']}.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Contract.*${testContract['id']}.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Message.*${generalRequest}.*`,"s"));
    },50000)

    test("Request Quote for Multiple Contracts - Email", async () => {
        await ahAPI.postMe(ahAPI.COMMON_TOKEN, {firstName:TestData.defaultUserDetails.fname, lastName:TestData.defaultUserDetails.lname, "locale": "en"});
        await ahAPI.updateTestOrganization({"locale": "en"});
        let emailQuery=`to:tesedi.assethub.test+stg@gmail.com subject:Quote Request Confirmation – ${TestData.defaultCustomerDetails.name}. is:unread`
        await gmailHelper.readEmails(emailQuery)
        let generalRequest= "AT General Request";
        let quoteAllContractsInGroup= "Yes";
        await ahAPI.requestQuoteForMultipleContracts(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,
            `${testContract['id']},${altContractId}`,
            testContract['groupId'],
            testContract['customerId'],
            generalRequest,
            quoteAllContractsInGroup,
           null);
        let quote_request_email_detail=await gmailHelper.waitForNewMessage(emailQuery,40000)
        let quote_request_message= await gmailHelper.getPlainHTMLFromMessage(quote_request_email_detail,0)
        let email_body=quote_request_message.body.textContent
        expect(email_body).toMatch(new RegExp(`.*Your Request.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*End Customer.*${TestData.defaultCustomerDetails.name}.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Group ID.*${testContract['groupId']}.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Contracts.*${testContract['id']},${altContractId}.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Message.*${generalRequest}.*`,"s"));
    },60000)

    test("Request Quote for Contract - Invalid contract/customer/group id", async () => {
        let response =await ahAPI.requestQuoteForContract(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,
            TestData.nonExisingId,
            testContract['groupId'],
            testContract['customerId'],
            "request", "No", null);
        expect(response.statusCode).toBe(200);
    })

    test("Request Quote for Contract - Unauthorized", async () => {
        let response =await ahAPI.requestQuoteForContract("BLAH",TestData.defaultOrgId,
            testContract['id'],
            testContract['groupId'],
            testContract['customerId'],
            "general request", "No",null);
        expect(response.statusCode).toBe(401);
    })

    test("Request Quote for Contract - Lack Permissions", async () => {
        let VIEWER_TOKEN=await ahAPI.getUserToken(TestData.defaultOperatorDetails);
        let response =await ahAPI.requestQuoteForContract(VIEWER_TOKEN,TestData.defaultOrgId,
            testContract['id'],
            testContract['groupId'],
            testContract['customerId'],
            "general request", "No",null);
        expect(response.statusCode).toBe(403);
    })

    test("Request Quote for Contract - Non-existing org", async () => {
        let response =await ahAPI.requestQuoteForContract(ahAPI.COMMON_TOKEN,TestData.nonExisingId,
            testContract['id'],
            testContract['groupId'],
            testContract['customerId'],
            "general request", "No",null);
        expect(response.statusCode).toBe(403);
    })

    describe("Create Contracts", ()=>{

        test("Create Contract - Without assets", async () => {
            let response;
            try {
                response = await ahAPI.createContract(ahAPI.COMMON_TOKEN, TestData.defaultOrgId, createContractPayload);
                expect(response.statusCode).toBe(200);
                expect(response.body).toMatchSchema({$ref: 'schema#/definitions/contract_summary'})
            }catch (err){
                throw err
            }finally {
                if (response.body) {
                    await ahDBHelper.removeContractFromDB(response.body.id);
                }
            }
        })

        test.each([
            { attr:"contractNumber",value:null, message:"contractNumber: String must contain at least 1 character" },
            { attr:"endDate",value:"", message:"endDate: Invalid datetime" },
            { attr:"vendorId",value:null, message:"vendorId: String must contain at least 1 character" },
            { attr:"vendorId",value:"9999", message:"vendorId: String must contain at least 1 character" },
            { attr:"distributorId",value:null, message:"distributorId: String must contain at least 1 character" },
            { attr:"distributorId",value:"9999", message:"distributorId: String must contain at least 1 character" },
            { attr:"resellerId",value:null, message:"resellerId: String must contain at least 1 character" },
            { attr:"resellerId",value:"9999", message:"resellerId: String must contain at least 1 character" },
            { attr:"endUserId",value:null, message:"endUserId: String must contain at least 1 character" },
            { attr:"endUserId",value:"999", message:"endUserId: String must contain at least 1 character" }
        ])("Create Contract - Without mandatory field [$attr]", async ({attr, message}) => {
            let response;
            try {
                let payload=structuredClone(createContractPayload);
                payload[attr]=""
                response = await ahAPI.createContract(ahAPI.COMMON_TOKEN, TestData.defaultOrgId, payload);
                expect(response.statusCode).toBe(400);
                expect(response.body.message).toMatch(new RegExp(message));
            }catch (err){
                throw err
            }finally {
                if (response.body) {
                    await ahDBHelper.removeContractFromDB(response.body.id);
                }
            }
        })


        test("Create Contract - Invalid Org", async () => {
            let response= await ahAPI.createContract(ahAPI.COMMON_TOKEN, TestData.nonExisingId, createContractPayload);
            expect(response.statusCode).toBe(403);
        })


        test("Create Contract - Unprivileged user", async () => {
            let TOKEN= await ahAPI.getUserToken(TestData.defaultViewerDetails);
            let response= await ahAPI.createContract(TOKEN, TestData.defaultOrgId, createContractPayload);
            expect(response.statusCode).toBe(403);
        })

        test("Create Contract - Unauthorized", async () => {
            let response= await ahAPI.createContract("BLAH", TestData.defaultOrgId, createContractPayload);
            expect(response.statusCode).toBe(401);
        })

        test("Create Contract - Import assets", async () => {
            let response1;
            try {
                response1 = await ahAPI.createContract(ahAPI.COMMON_TOKEN, TestData.defaultOrgId, createContractPayload);
                importContractAssetsPayload.contractId=response1.body.id
                let response = await ahAPI.importContractAssets(ahAPI.COMMON_TOKEN, importContractAssetsPayload,TestData.defaultOrgId);
                expect(response.statusCode).toBe(200);
            }catch (err){
                throw err
            }finally {
                if (response1.body) {
                    await ahDBHelper.removeContractFromDB(response1.body.id);
                }
            }
        },20000)
    });


    describe("Validate Contracts Assets", ()=>{

        let contractAssetPayload={"assets": [importContractAsset1Details]}

        test("Validate - Positive - Single", async () => {
            let response = await ahAPI.validateContractAssets(ahAPI.COMMON_TOKEN,  contractAssetPayload,TestData.defaultOrgId);
            expect(response.statusCode).toBe(200);
        })

        test("Validate - Positive - Multiple", async () => {
            let response = await ahAPI.validateContractAssets(ahAPI.COMMON_TOKEN,  importContractAssetsPayload,TestData.defaultOrgId);
            expect(response.statusCode).toBe(200);
        })

        test.each([
            { attr:"serialNumber",value:undefined, message:"serialNumber: Required" , descr: "Empty Serial Number"},
            { attr:"productSku",value:"blah", message:"Produkt-SKU existiert nicht", descr: "Empty productSku" },
            { attr:"productSku",value:undefined, message:"productSku: Required" , descr: "Empty productSKU"},
            { attr:"serviceGroupSku",value:"blah", message:"Servicegruppen-SKU existiert nicht", descr: "Empty serviceGroupSku" },
            { attr:"serviceGroupSku",value:undefined, message:"serviceGroupSku: Required" , descr: "Empty serviceGroupSku"},
        ])("Validate - Negative - [$descr]", async ({attr,value, message}) => {
                let payload=structuredClone(contractAssetPayload);
                payload["assets"][0][attr]=value
                let response = await ahAPI.validateContractAssets(ahAPI.COMMON_TOKEN, payload,TestData.defaultOrgId);
                expect(response.statusCode).toBe(400);
                expect(JSON.stringify(response.body)).toMatch(new RegExp(message));
        })

        test("Validate - Negative - Multiple", async () => {
            let payload=structuredClone(importContractAssetsPayload);
            payload["assets"][0]["productSku"]="blah"
            let response = await ahAPI.validateContractAssets(ahAPI.COMMON_TOKEN, payload,TestData.defaultOrgId);
            expect(response.statusCode).toBe(400);
            expect(JSON.stringify(response.body)).toMatch(new RegExp("Produkt-SKU existiert nicht"));
        })

        test("Validate - Unauthorized", async () => {
            let response= await ahAPI.validateContractAssets("BLAH", importContractAssetsPayload,TestData.defaultOrgId);
            expect(response.statusCode).toBe(401);
        })

    });
})

