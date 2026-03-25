import ahAPI from "../../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../../testdata";
import {expect, jest, test} from '@jest/globals';
module.exports = { testRunner: 'jest-circus/runner' };
import ahDbHelper from "../../../api/AHDBHelper";
import * as allure from "allure-js-commons";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let VIEWER_TOKEN=""
let testOrgId=TestData.defaultOrgId

describe('[jest] Quotes Requests', () => {
    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {
        VIEWER_TOKEN= await ahAPI.getUserToken(TestData.defaultViewerUser);
        await TestData.initUsersAndRoles()
    })

    let defaultQuotesRequestExistingCustomer={
        "customerId": TestData.defaultEndUserDetails.id,
        "message": "Request for multiple items",
        "assets":"[" +
                    "{  \"serialNumber\":\"SN001\",\"productSku\":\"SKU001\",\"endDate\":\"2026-08-29T22:00:00.000Z\"," +
                        "\"serviceGroupSku\":\"H7J36AC\",\"serviceGroupVendor\":\"274587\"," +
                        "\"serviceGroupDescription\":\"HPE Foundation Care CTR Service\"}," +
                        "{\"serialNumber\":\"SN002\",\"productSku\":\"SKU002\",\"endDate\":\"2026-08-29T22:00:00.000Z\"," +
                        "\"serviceGroupSku\":\"H7J36AC\",\"serviceGroupVendor\":\"274587\"," +
                        "\"serviceGroupDescription\":\"HPE Foundation Care CTR Service\"}]"
    }
    let defaultQuotesRequestNewCustomer={
        "customerName": "New customer",
        "contact" :{
            "firstName":"AT",  "lastName":"User", "email":"test@tesedi.com", "phone":"+1234567890",
            "address":"ul. Zyczkowskiego 5/5", "zip":"31-863", "location":"Krakow"
        },
        "message": "Request for multiple items",
        "assets": defaultQuotesRequestExistingCustomer.assets
    }
    let changeAssetNonExisting=
        {   "productSku": "805358-B22", "serialNumber": "RFANUA7TH360BJ",
            "oldServiceGroupVendor": "255862", "oldServiceGroupSku": "HU4B2AD",
            "newServiceGroupVendor": "255863", "newServiceGroupSku": "HT7A0AF"}


    test("Quote - Request Quotes - Unauthorized", async () => {
        let response =await ahAPI.sendQuotesRequest("BLAH", testOrgId,defaultQuotesRequestExistingCustomer);
        expect(response.statusCode).toBe(401);
    })

    test("Quote - Request Quotes - Lack of permissions", async () => {
        let response =await ahAPI.sendQuotesRequest(VIEWER_TOKEN, testOrgId,defaultQuotesRequestExistingCustomer);
        expect(response.statusCode).toBe(401);
    })

    test("Quote - Request Quotes - Unknown orgId", async () => {
        let response =await ahAPI.sendQuotesRequest(ahAPI.COMMON_TOKEN, TestData.nonExisingId,defaultQuotesRequestExistingCustomer);
        expect(response.statusCode).toBe(403);
    })

    test("Quote - Request Quotes - No customer info", async () => {
        let response =await ahAPI.sendQuotesRequestMultipart(ahAPI.COMMON_TOKEN, testOrgId,
            {
                "assets": [
                    {   "serialNumber": "APT-04-287365", "productSku": "ASHPD-1978-00X",
                        "serviceGroupVendor": "255861", "serviceGroupSku": "HU4A1AC", "endDate": "1978-06-15T08:42:00Z"}
                ]
            });
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("[\"customerId.customerName: Either Customer ID or Customer Name must be provided\"]");
    })

    test("Quote - Request Quotes - No assets info", async () => {
        let response =await ahAPI.sendQuotesRequestMultipart(ahAPI.COMMON_TOKEN, testOrgId,
            {      "customerId": TestData.defaultEndUserDetails.id});
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch("At least one asset or file is required");
    })

    test("Quote - Request Quotes - Asset - No serial number", async () => {
        let response =await ahAPI.sendQuotesRequestMultipart(ahAPI.COMMON_TOKEN, testOrgId,
            {
                "customerName": "Name:Aperture Science",
                "assets": "[{ \"serialNumber\":null,\"productSku\":\"SKU001\",\"endDate\":\"2026-08-29T22:00:00.000Z\"," +
                    "\"serviceGroupSku\":\"H7J36AC\",\"serviceGroupVendor\":\"274587\",\"serviceGroupDescription\":\"HPE Foundation Care CTR Service\"}]"
            });
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("[\"assets.0.serialNumber: Expected string, received null\"]");
    })

    test("Quote - Request Quotes - Asset - Invalid date", async () => {
        let response =await ahAPI.sendQuotesRequestMultipart(ahAPI.COMMON_TOKEN, testOrgId,
            {
                "customerName": "Name:Aperture Science",
                "assets": "[{ \"serialNumber\":\"SN001\",\"productSku\":\"SKU001\",\"endDate\":\"blah\"," +
                    "\"serviceGroupSku\":\"H7J36AC\",\"serviceGroupVendor\":\"274587\",\"serviceGroupDescription\":\"HPE Foundation Care CTR Service\"}]"
            });
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(/assets.0.endDate: Invalid datetime/);
    })

    test("Quote - Request Quotes - Asset - Unknown service SKU", async () => {
        let response =await ahAPI.sendQuotesRequestMultipart(ahAPI.COMMON_TOKEN, testOrgId,
            {
                "customerId": TestData.defaultEndUserDetails.id,
                "assets": "[{ \"serialNumber\":\"SN001\",\"productSku\":\"SKU001\",\"endDate\":\"2026-08-29T22:00:00.000Z\"," +
                    "\"serviceGroupSku\":\"99999\",\"serviceGroupVendor\":\"274587\",\"serviceGroupDescription\":\"HPE Foundation Care CTR Service\"}]"
            });
        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe("Provided combination of service group sku 99999 and service group vendor 274587 does not exist");
    })

    test("Quote - Request Quotes - Incomplete address", async () => {
        let customerPayload=defaultQuotesRequestNewCustomer;
        customerPayload['contact'].zip=null;
        customerPayload['contact'].phone=null;
        customerPayload['contact'].address=null;
        let response =await ahAPI.sendQuotesRequestMultipart(ahAPI.COMMON_TOKEN, testOrgId, customerPayload);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("[\"address.contact: Address and contact are required when Customer ID is not provided\"]");
    })

    test("Quote - Request Quotes - Incomplete contact", async () => {
        let customerPayload=defaultQuotesRequestNewCustomer;
        customerPayload['contact'].firstName=null;
        customerPayload['contact'].lastName=null;
        let response =await ahAPI.sendQuotesRequestMultipart(ahAPI.COMMON_TOKEN, testOrgId, customerPayload);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("[\"address.contact: Address and contact are required when Customer ID is not provided\"]");
    })
    test("Quote - Request Changes - No assets", async () => {
        let response =await ahAPI.sendQuoteChangeRequest(ahAPI.COMMON_TOKEN,
            testOrgId,
            TestData.defaultQWCQuoteId, {
                "message":"Request message", "cancellationReason":"My Cancellation reason",
            });
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("[\"assets: Required\"]");
    })

    test("Quote - Request Changes - Unknown asset", async () => {
        let response =await ahAPI.sendQuoteChangeRequest(ahAPI.COMMON_TOKEN,
            testOrgId,
            TestData.defaultQWCQuoteId, {
                "message":"Request message", "cancellationReason":"My Cancellation reason",
                "assets":[changeAssetNonExisting]
            });
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(/Asset mit der Seriennummer.*nicht gefunden/);
    })

    test("Quote - Request Changes - non-existing quote", async () => {
        let response =await ahAPI.sendQuoteChangeRequest(ahAPI.COMMON_TOKEN,
            testOrgId,
            TestData.nonExisingId, {
                "message":"Request message", "cancellationReason":"My Cancellation reason",
                "assets":[TestData.changeAsset]
            });
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(new RegExp(`${TestData.errorMessages["QUOTE_NOT_EXISTS"]}`));
    })

    test("Quote - Request Changes - Unauthorized", async () => {
        let response =await ahAPI.sendQuoteChangeRequest("BLAH",
            testOrgId,
            TestData.defaultQWCQuoteId, {
                "message":"Request message", "cancellationReason":"My Cancellation reason",
                "assets":[TestData.changeAsset]
            });
        expect(response.statusCode).toBe(401);
    })
    test("Quote - Request Changes - Lack of permission", async () => {

        let response =await ahAPI.sendQuoteChangeRequest(VIEWER_TOKEN,
            testOrgId,
            TestData.defaultQWCQuoteId, {
                "message":"Request message", "cancellationReason":"My Cancellation reason",
                "assets":[TestData.changeAsset]
            });
        expect(response.statusCode).toBe(401);
    })

    test("Quote - Approve - Too big PO file", async () => {
        await ahDbHelper.set_quote_status(TestData.defaultQWCQuote.quoteNo, "Open")
        let response =await ahAPI.sendQuoteApproveRequest(ahAPI.COMMON_TOKEN,TestData.defaultQWCQuoteId,"src/tests/poFile22.pdf","AT comment","AT PO number", testOrgId);
        expect(response.statusCode).toBe(500);
        //expect(response.body.message.toString()).toMatch(/.*Total attachment.*should not exceed 20 MB.*/);
    },30000)


    test("Quote - Approve - Wrong format", async () => {
        let response =await ahAPI.sendQuoteApproveRequest(ahAPI.COMMON_TOKEN,TestData.defaultQWCQuoteId,"src/tests/schema.json","AT comment","AT PO number", testOrgId);
        expect(response.statusCode).toBe(400);
        expect(response.body.message.toString()).toMatch(/.*Invalid file type.*/);
    })


    test("Quote - Approve - Non-existing quote id", async () => {
        let response =await ahAPI.sendQuoteApproveRequest(ahAPI.COMMON_TOKEN,"BLAHBLAH","src/tests/poFile.pdf","AT comment","AT PO number", testOrgId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(new RegExp(`${TestData.errorMessages['QUOTE_NOT_EXISTS']}`));
    })

    test("Quote - Approve - Non-existing organization", async () => {
        let response =await ahAPI.sendQuoteApproveRequest(ahAPI.COMMON_TOKEN,TestData.defaultQWCQuoteId,null,"","", TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    })

    test("Quote - Approve - Unauthorized", async () => {
        let response =await ahAPI.sendQuoteApproveRequest("blah",TestData.defaultQWCQuoteId,null,"","", testOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Quote - Approve - Lack permission", async () => {
        let response =await ahAPI.sendQuoteApproveRequest(VIEWER_TOKEN,TestData.defaultQWCQuoteId,null,"","", testOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Quote - Decline - Non-existing quote id", async () => {
        let response =await ahAPI.sendQuoteDeclineRequest(ahAPI.COMMON_TOKEN,TestData.nonExisingId,"", testOrgId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(new RegExp(`${TestData.errorMessages['QUOTE_NOT_EXISTS']}`));
    })

    test("Quote - Decline - Non-existing organization", async () => {
        let response =await ahAPI.sendQuoteDeclineRequest(ahAPI.COMMON_TOKEN,TestData.defaultQWCQuoteId,"", TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    })

    test("Quote - Decline - Unauthorized", async () => {
        let response =await ahAPI.sendQuoteDeclineRequest("blah",TestData.defaultQWCQuoteId,"", testOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Quote - Decline - Lack permission", async () => {
        let response =await ahAPI.sendQuoteDeclineRequest(VIEWER_TOKEN,TestData.defaultQWCQuoteId,"", testOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("SP Quote - Approve - Not agreed Terms and Condition", async () => {
        let approvePayload=structuredClone(TestData.spQuoteApproveDetails);
        approvePayload.agreement=TestData.nonExisingId
        await ahDbHelper.set_quote_status(TestData.defaultSPQuote.quoteNo, "Open")
        let response = await ahAPI.sendSPQuoteApproveRequest(ahAPI.COMMON_TOKEN, TestData.defaultServicePack.id, TestData.defaultSPQuote.id, approvePayload, TestData.defaultOrgId);
        expect(response.statusCode).toBe(500);
    });

    test("SP Quote - Approve - Invalid SG info", async () => {
        let approvePayload=structuredClone(TestData.spQuoteApproveDetails);
        approvePayload.sgSKU="BLAH"
        approvePayload.sgName="BLAH"
        await ahDbHelper.set_quote_status(TestData.defaultSPQuote.quoteNo, "Open")
        let response = await ahAPI.sendSPQuoteApproveRequest(ahAPI.COMMON_TOKEN, TestData.defaultServicePack.id, TestData.defaultSPQuote.id, approvePayload, TestData.defaultOrgId);
        expect(response.statusCode).toBe(500);
        expect(response.body.message).toMatch("Service group not found")
    });

    test("SP Quote - Approve - Unauthorized", async () => {
        await ahDbHelper.set_quote_status(TestData.defaultSPQuote.quoteNo, "Open")
        let response = await ahAPI.sendSPQuoteApproveRequest("BLAH", TestData.defaultServicePack.id, TestData.defaultSPQuote.id, TestData.spQuoteApproveDetails, TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    });

    test("SP Quote - Approve - Unprivileged", async () => {
        await ahDbHelper.set_quote_status(TestData.defaultSPQuote.quoteNo, "Open")
        let response = await ahAPI.sendSPQuoteApproveRequest(VIEWER_TOKEN, TestData.defaultServicePack.id, TestData.defaultSPQuote.id, TestData.spQuoteApproveDetails, TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    });

    test("SP Quote - Approve - Unknown Org", async () => {
        await ahDbHelper.set_quote_status(TestData.defaultSPQuote.quoteNo, "Open")
        let response = await ahAPI.sendSPQuoteApproveRequest(ahAPI.COMMON_TOKEN, TestData.defaultServicePack.id, TestData.defaultSPQuote.id, TestData.spQuoteApproveDetails, TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    });

    test("SP Quote - Approve - Unknown SP id", async () => {
        await ahDbHelper.set_quote_status(TestData.defaultSPQuote.quoteNo, "Open")
        let response = await ahAPI.sendSPQuoteApproveRequest(ahAPI.COMMON_TOKEN, TestData.nonExisingId, TestData.defaultSPQuote.id, TestData.spQuoteApproveDetails, TestData.defaultOrgId);
        expect(response.statusCode).toBe(404);
    });

    test("SP Quote - Approve - Unknown Quote id", async () => {
        await ahDbHelper.set_quote_status(TestData.defaultSPQuote.quoteNo, "Open")
        let response = await ahAPI.sendSPQuoteApproveRequest(ahAPI.COMMON_TOKEN, TestData.defaultServicePack.id, TestData.nonExisingId, TestData.spQuoteApproveDetails, TestData.defaultOrgId);
        expect(response.statusCode).toBe(404);
    });

})