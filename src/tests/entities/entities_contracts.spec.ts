import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import commonHelper from "../../api/CommonHelper";
import {test} from "@jest/globals";
import {addDays, substractDays} from "../../api/utils";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let testContract=TestData.TEST_CONTRACT_MAP[TestData.TEST_DATA_MODE];
describe('[jest] Entity - Contracts', () => {
     let customerWithContracts=TestData.defaultEndUserDetails.id;
    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {})

    test("Get Contracts", async () => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/contracts'})
    })
    test("Contract Info", async () => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts", TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
       let targetContract=response.body.data.find(t=>t["id"]===(testContract["id"].toString()));
        expect(targetContract.id).toEqual(testContract["id"].toString());
        expect(targetContract.contractNumber).toEqual(testContract["contractNumber"]);
        expect(targetContract.status).toEqual((typeof testContract["status"] === "number")?
            TestData.STATUSES[testContract["status"]]:testContract["status"]);
        expect(targetContract.groupId).toEqual(testContract["groupId"]);
        expect(targetContract.startDate).toEqual(testContract["startDate"]);
        expect(targetContract.endDate).toEqual(testContract["endDate"]);
        expect(targetContract.sar).toEqual(testContract["sar"]);
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

    (`Sorting by $attr in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,
            customerWithContracts,"contracts",TestData.defaultOrgId,`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder= response.body.data.filter(t=>t!==null).map(t=>( t[attr]?.name!==undefined)?t[attr].name:t[attr]);
        origOrder=origOrder.filter(t=>t!==null)
        let actualOrderString=origOrder.filter(t=>t!==null).join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order,false);
        expect(actualOrderString).toEqual(expectedOrderString);
    })

    test("Pagination - Default", async () => {
        let response =await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts","","","","",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBeLessThanOrEqual(50)
        // TODO: configure Entity with 100+ contracts
        // expect(response.body.meta.hasNextPage).toBe(true)
        // expect(response.body.meta.nextCursor).not.toBeNull();
    })


    test("Pagination - 100 pages", async () => {
        let response =await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts","100","","","",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBeLessThanOrEqual(100)
        // TODO: configure Entity with 100+ contracts
        // expect(response.body.meta.hasNextPage).toBe(true)
        // expect(response.body.meta.nextCursor).not.toBeNull();
    })

    test("Pagination - Cursor", async () => {
        let entities20 =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts","20","","","",TestData.defaultOrgId)).body.data;
        let response=await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts","10","","","",TestData.defaultOrgId);
        let nextCursor=response.body.meta.nextCursor
        let quotesFirst10 =response.body.data;
        let quotesLast10 =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts","10",nextCursor,"","",TestData.defaultOrgId)).body.data;
        expect(entities20.map(u=>u.id).join(",")).toContain(quotesFirst10.map(u=>u.id).join(","));
        expect(entities20.map(u=>u.id).join(",")).toContain((quotesLast10.map(u=>u.id)).join(","));
    })

    test("Pagination - Non-Existing cursor", async () => {
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts","10","blah","","",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).not.toBeGreaterThan(10)
        expect(response.body.meta.hasNextPage).toBe(false)
        expect(response.body.meta.nextCursor).toBeNull();
    })

    test.each([
        { attribute: "contractNumber", query: "6389" },
        { attribute: "groupId", query: "SMD501" },
        { attribute: "groupId", query: " 1686" },
        { attribute: "sar", query: "SCHWE403" }
    ])
    ("Search - by $attribute", async ({attribute,query}) => {
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts","","",query,"",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u[attribute]).join(",")).toBe(response.body.data.filter(u=>u[attribute].includes(query)).map(u=>u[attribute]).join(","))
    })

    test("Search without results", async () => {
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts","","","blah","",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data).toHaveLength(0)})

    test("Filter - Status", async () => {
        let status= "status[]=Renewed";let statusString= "Renewed"
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts","","","",status,TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(   response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u.status.startsWith(statusString)).map(u=>u.id).join(","))
    })
    test("Filter - Multiple statuses", async () => {
        let status="status[]=Renewed&status[]=Expired";let statusRegexp="(Renewed|Expired)";
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts","","","",status,TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u.status.match(statusRegexp)).map(u=>u.id).join(","))
    })

    test("Filter - Status - Non-Exising", async () => {
        let response =(await ahAPI.getEntityItemsWithParams(ahAPI.COMMON_TOKEN,customerWithContracts, "contracts","","","","status[]=BLAH",TestData.defaultOrgId));
        expect(response.statusCode).toBe(400)
        expect(response.body.message).toMatch(/status: Invalid input/);
    })

    test("Filter - Vendor", async () => {
        let vendorName=TestData.defaultDistributorVendorDetails.name
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts", TestData.defaultOrgId,`?vendorNames[]=${vendorName}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u['vendor'].name.startsWith(vendorName)).map(u=>u.id).join(","))
    })

    test("Filter - Multiple Vendors", async () => {
        let vendorName=TestData.defaultDistributorVendorDetails.name
        let vendor2Name=TestData.altVendorDetails.name
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts", TestData.defaultOrgId,`?vendorNames[]=${vendorName}&vendorNames[]=${vendor2Name}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>u['vendor'].name.match(`(${vendorName}|${vendor2Name})`)).map(u=>u.id).join(","))
    })

    test("Filter - Vendor - Non-matching", async () => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts",TestData.defaultOrgId, `?vendorNames[]=BLAH`);
        expect(response.body.data.length).toBe(0)
    })

    test.each([
        { remainingDays: 30 },
        { remainingDays: 60  },
        { remainingDays: 90 },
    ])("Filter - Remaining Days - $remainingDays", async ({remainingDays}) => {
        const expectedExpirationDate = addDays(remainingDays);
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts",TestData.defaultOrgId, `?remainingDays[]=Expires in ${remainingDays} days`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(",")).toBe(response.body.data.filter(u=>expectedExpirationDate>=new Date(u['endDate'])).map(u=>u.id).join(","))
    })

    test("Get Contracts - Filter - Quoted", async () => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts",TestData.defaultOrgId,`?isQuoted=true`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.length).toBe(response.body.data.filter(u=>u.isQuoted).length)
    })

    test("Filter - End Date - Between Dates", async () => {
        const dateEnd = addDays(365);
        const dateStart = substractDays(700);
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts",TestData.defaultOrgId, `?endDateAfter=${dateStart.toISOString()}&endDateBefore=${dateEnd.toISOString()}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.id).join(","))
            .toBe(response.body.data.filter(u=>(dateStart<=new Date(u['endDate']))&&(new Date(u['endDate'])<=dateEnd)).map(u=>u.id).join(","))
    })

    test("Non-existing entity", async () => {
        let response =await ahAPI.getEntityItems(ahAPI.COMMON_TOKEN,customerWithContracts,"contracts",TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    })

    test("Unauthorized", async () => {
        let response =await ahAPI.getEntityItems("blah",customerWithContracts,"contracts",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

})

