import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import commonHelper from "../../api/CommonHelper";
import {expect} from "@jest/globals";
import gmailHelper from "../../api/GmailHelper";
import commonAPIHelper from "../../api/CommonAPIHelper";
import {ENV} from "../../../environment";
import * as allure from "allure-js-commons";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));

describe('iAsset webhooks', () => {
    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        await ahAPI.getCommonWebHooksSession();
       })
    beforeAll(async () => {
        await gmailHelper.authorize()
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        await ahAPI.postMe(ahAPI.COMMON_TOKEN, {firstName:TestData.defaultUserDetails.fname, lastName:TestData.defaultUserDetails.lname, "locale": "en"});
        await ahAPI.updateTestOrganization({"locale": "en"});
    })

    test.each([
        { iAStatus: "CREATED", ahStatus: "Invalid" },
        { iAStatus: "PREPARATION", ahStatus: "Invalid" },
        { iAStatus: "QUOTE READY", ahStatus: "Invalid" },
        { iAStatus: "CANCELLED", ahStatus: "Invalid" },
        { iAStatus: "READY TO ORDER", ahStatus: "Ordered" },
        { iAStatus: "CUSTOMER ORDER", ahStatus: "Ordered" },
        { iAStatus: "NEW STATUS TBD", ahStatus: "Ordered" },
        { iAStatus: "ORDER CONFIRMED", ahStatus: "Ordered" },
        { iAStatus: "INVOICED", ahStatus: "Ordered" },
        { iAStatus: "LOST", ahStatus: "Lost" }
    ])(`Quote webhook - Status changed - $iAStatus `, async ({iAStatus,ahStatus}) => {
        let whPayload=TestData.QUOTE_WEBHOOK
        whPayload["QuoteStatus"]=iAStatus;
        let result= await ahAPI.sendWebhook(whPayload, "quote", "quotes");
        expect(JSON.stringify(result.body)).toBe("{\"status\":\"ok\"}")
        let res=await ahAPI.getQuote(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  whPayload['QuoteId']);
        expect(res.body.status).toBe(iAStatus);
        expect(res.body.uiStatus).toBe(ahStatus.trim());
    },10000)

    test.each([
        { iAStatus: "Customer Contact", ahStatus: "Open" },
        { iAStatus: "Discount Approval", ahStatus: "Change Requested" },
        { iAStatus: "Customer Contact", ahStatus: "Open" },
    ])(`Quote webhook - Status changed 2 - $iAStatus `, async ({iAStatus,ahStatus}) => {
        let whPayload=TestData.QUOTE_WEBHOOK
        whPayload["QuoteStatus"]=iAStatus;
        let result= await ahAPI.sendWebhook(whPayload, "quote", "quotes");

        expect(JSON.stringify(result.body)).toBe("{\"status\":\"ok\"}")
        let res=await ahAPI.getQuote(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  whPayload['QuoteId']);
        expect(res.body.status).toBe(iAStatus);
        expect(res.body.uiStatus).toBe(ahStatus.trim());
        if (ahStatus== "Change Requested" ){
            await commonHelper.sleep(1000)
        }
    })

    test(`Quote webhook - Status changed - Quote Updated - Email `, async () => {
        let emailQuery=`to:tesedi.assethub.test+stg@gmail.com subject:Quote updated – ${TestData.defaultQWCQuote.quoteNo}. is:unread`
        await gmailHelper.readEmails(emailQuery)
        let whPayload=TestData.QUOTE_WEBHOOK
        whPayload["QuoteStatus"]="Customer Contact";
        await ahAPI.sendWebhook(whPayload, "quote", "quotes");
        whPayload["QuoteStatus"]="Discount Approval";
        await ahAPI.sendWebhook(whPayload, "quote", "quotes");
        await commonHelper.sleep(1000)
        whPayload["QuoteStatus"]="Customer Contact";
        await ahAPI.sendWebhook(whPayload, "quote", "quotes")
        let quote_request_email_detail=await gmailHelper.waitForNewMessage(emailQuery)
        let quote_request_message= await gmailHelper.getPlainHTMLFromMessage(quote_request_email_detail,0)
        const links = await (await gmailHelper.getPlainHTMLFromMessage(quote_request_email_detail)).getElementsByTagName('a');
        let urls=(await commonAPIHelper.send("GET",links[0].getAttribute("href"),"",{})).text.match(/https?:\/\/[^\s"'<>]+/g) || [];
        let email_body=quote_request_message.body.textContent
        expect(email_body).toMatch(new RegExp(`.*Quote updated -.*${TestData.defaultQWCQuote.quoteNo}.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Customer.*Customer 20.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Quote Number.*${TestData.defaultQWCQuote.quoteNo}.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Start Date.*01.09.2024.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*End Date.*31.08.2025.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Retail Price.*CHF.*48,014.63.*`,"s"));
        expect(urls[0]).toBe(`${ENV.BASE_FRONTEND_URL}/quotes/${TestData.defaultQWCQuote.id}`);
    },60000)


    test.each([
        { iAStatus: "Archived", statusCode: 6, ahStatus: "Invalid" },
        { iAStatus: "Not Validated", statusCode: 1,ahStatus: "Invalid" },
        { iAStatus: "Active",statusCode: 2,ahStatus: "Active" },
        { iAStatus: "Expired", statusCode: 4, ahStatus: "Expired" },
        { iAStatus: "Terminated",statusCode: 5, ahStatus: "Terminated" },
        { iAStatus: "Renewed", statusCode: 15, ahStatus: "Renewed" }
    ])
    ("Contract webhook - Status changed - $iAStatus", async ({iAStatus,statusCode,ahStatus}) => {
        let whPayload=TestData.CONTRACT_WEBHOOK
        whPayload["ContractStatusId"]=statusCode;
        let result= await ahAPI.sendWebhook(whPayload, "contract", "contracts");
        expect(JSON.stringify(result.body)).toBe("{\"status\":\"ok\"}")
        let res=await ahAPI.getContract(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,  whPayload['ContractId']);
        expect(res.body.status).toBe(iAStatus);
        expect(res.body['uiStatus']).toBe(ahStatus);
    })

    test(`Contract webhook - New Contract - Email`, async () => {
        let emailQuery=`to:tesedi.assethub.test+stg@gmail.com subject:New Contract Available. is:unread`
        await gmailHelper.readEmails(emailQuery)
        let whPayload=TestData.CONTRACT_WEBHOOK
        whPayload["ContractStatusId"]=1;
        await ahAPI.sendWebhook(whPayload, "contract", "contracts");
        whPayload["ContractStatusId"]=2;
        await ahAPI.sendWebhook(whPayload, "contract", "contracts");
        let newcontrat_email_detail=await gmailHelper.waitForNewMessage(emailQuery,200000)
        let quote_request_message= await gmailHelper.getPlainHTMLFromMessage(newcontrat_email_detail,0)
        const links = await (await gmailHelper.getPlainHTMLFromMessage(newcontrat_email_detail)).getElementsByTagName('a');
        let urls=(await commonAPIHelper.send("GET",links[0].getAttribute("href"),"",{})).text.match(/https?:\/\/[^\s"'<>]+/g) || [];
        let email_body=quote_request_message.body.textContent
        expect(email_body).toMatch(new RegExp(`.*New Contract Activated.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Customer.*Customer 20.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Contract Number.*${whPayload['ContractNo']}.*`,"s"));
        expect(email_body).toMatch(new RegExp(`.*Group ID.*${whPayload['GroupID']}.*`,"s"));
        expect(urls[0]).toContain(`${ENV.BASE_FRONTEND_URL}/contracts?search=${whPayload['GroupID']}`);
    },200000)
})

