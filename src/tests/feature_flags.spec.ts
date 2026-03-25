import ahAPI from "../api/SupertestAHAPIHelper";
import TestData from "./testdata";
import ahDbHelper from "../api/AHDBHelper";
import {sleep} from "../api/utils";
import gmailHelper from "../api/GmailHelper";
import freshdeskHelper from "../api/FreshdeskHelper";
const { matchersWithOptions } = require('jest-json-schema');
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));

afterEach(async () => {await ahAPI.clearCommonSession();})
beforeAll(async () => {await ahAPI.getCommonSessionForSA()})
beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
describe('[jest] Feature Flags', () => {

    test("Get feature flags", async () => {
        const response = await ahAPI.getFeatureFlags( ahAPI.COMMON_TOKEN);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/feature-flags'})
    })

    test("Get feature flags - Info", async () => {
        const response = await ahAPI.getFeatureFlags( ahAPI.COMMON_TOKEN);
        expect(response.statusCode).toBe(200);
        expect(response.body.map((t)=>t.name).sort().toString()).toBe(TestData.FEATURE_FLAGS.sort().toString())
    })

    test("Get feature flags - Unauthorized", async () => {
        const response = await ahAPI.getFeatureFlags( "BLAH");
        expect(response.statusCode).toBe(401);
    })

    test("Get feature flags - Unprivileged", async () => {
        let VIEWER_TOKEN= await ahAPI.getUserToken(TestData.defaultViewerUser);
        const response = await ahAPI.getFeatureFlags( VIEWER_TOKEN);
        expect(response.statusCode).toBe(401);
    })

    test("Feature flags - Generate Quote PDF", async () => {
        let ff_name = "generate_quote_pdf"
        let orig_ff_status = (await ahDbHelper.get_ff(ff_name)).enabled
        try {
            await ahDbHelper.enable_ff(ff_name)
            await sleep(1)
            let response =await ahAPI.getQuotePDF(ahAPI.COMMON_TOKEN,TestData.previewPDFOrgId,  TestData.defaultQuoteWithPDFId);
            expect(response.statusCode).toBe(200);
            await ahDbHelper.disable_ff(ff_name)
            await sleep(1)
            response =await ahAPI.getQuotePDF(ahAPI.COMMON_TOKEN,TestData.previewPDFOrgId,  TestData.defaultQuoteWithPDFId);
            expect(response.statusCode).toBe(200);
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.set_ff_status(ff_name, orig_ff_status)
        }
    },30000)

    test("Feature flags - Contract Jobs", async () => {
        await ahAPI.getCommonWebHooksSession();
        await gmailHelper.authorize()
        let ff_name = "contract_jobs"
        try {
            await ahDbHelper.disable_ff(ff_name)
            await sleep(1)

            let emailQuery=`to:tesedi.assethub.test+stg@gmail.com subject:New Contract Available. is:unread`
            await gmailHelper.readEmails(emailQuery)
            let whPayload=TestData.CONTRACT_WEBHOOK
            whPayload["ContractStatusId"]=1;
            await ahAPI.sendWebhook(whPayload, "contract", "contracts");
            whPayload["ContractStatusId"]=2;
            await ahAPI.sendWebhook(whPayload, "contract", "contracts");
            let email
            try {
                email=await gmailHelper.waitForNewMessage(emailQuery, 180000)
            }catch (e) {}
            finally {
                if (email != undefined){
                    throw new Error("Unexpected email was received");
                }
            }
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.enable_ff(ff_name)
        }
    },200000)


    test("Feature flags - HPE clicker", async () => {
        await ahAPI.getCommonWebHooksSession();
        await gmailHelper.authorize()
        let ff_name = "hpe_clicker"
        try {
            await ahDbHelper.disable_ff(ff_name)
            await sleep(1)
            await ahDbHelper.set_quote_status(TestData.altSPQuote.quoteNo, "Open")
            let payload = {firstName:TestData.defaultUserDetails.fname, lastName:TestData.defaultUserDetails.lname, "locale": "en"}
            await ahAPI.postMe(ahAPI.COMMON_TOKEN, payload);
            await gmailHelper.readEmails(TestData.spQuoteConfirmationMessageFilter)
            let fd_tickets = (await freshdeskHelper.search_recent_ticket("type:'Order'")).results;
            let rsp = await ahAPI.sendSPQuoteApproveRequest(ahAPI.COMMON_TOKEN, TestData.altServicePack.id, TestData.altSPQuote.id, TestData.spAltQuoteApproveDetails, TestData.altOrgId);
            expect(rsp.statusCode).toBe(200);
           await freshdeskHelper.wait_for_new_ticket("type:'Order'", fd_tickets, 20, `HPE Clicker Disabled - Manual Processing Required.*${TestData.altSPQuote.quoteNo}`)
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.enable_ff(ff_name)
        }
    },60000)


    test("Feature flags - Renewal Report", async () => {
        await ahAPI.getCommonWebHooksSession();
        await gmailHelper.authorize()
        let ff_name = "renewal_report"
        try {
            await ahDbHelper.enable_ff(ff_name)
            await sleep(2)
            await gmailHelper.readEmails(TestData.renewalReportMessageFilter)
            let rsp = await ahAPI.sendRenewalReportRequest(ahAPI.COMMON_TOKEN);
            expect(rsp.statusCode).toBe(201);
            let newmessage=await gmailHelper.waitForNewMessage(TestData.renewalReportMessageFilter)
            await gmailHelper.markMessageAsRead(newmessage.id);
            await ahDbHelper.disable_ff(ff_name)
            await sleep(2)
            await gmailHelper.readEmails(TestData.renewalReportMessageFilter)
            await ahAPI.sendRenewalReportRequest(ahAPI.COMMON_TOKEN);
            newmessage=undefined
            try {
                newmessage=await gmailHelper.waitForNewMessage(TestData.renewalReportMessageFilter)
            }catch (e) {}
            finally {
                if (newmessage != undefined){
                    throw new Error("Unexpected email was received");
                }
            }
        } catch (e) {
            throw e;
        } finally {
            await ahDbHelper.enable_ff(ff_name)
        }
    },60000)
})