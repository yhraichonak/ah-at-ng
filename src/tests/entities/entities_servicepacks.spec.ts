import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import commonHelper from "../../api/CommonHelper";
import {test} from "@jest/globals";

expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
describe('[jest] Entity Service Packs', () => {
    let customerWithServicePacks=TestData.defaultEndUserDetails.id;
    let spToDel="ATSP-TO-DELETE";
    let sp_prefix="AT_SP_PG";
    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        await  ahAPI.deleteServicePacksByQuery(ahAPI.COMMON_TOKEN, spToDel,TestData.defaultOrgId)
    },20000)
    test("Get Entity Service Packs", async () => {
        const response = await ahAPI.getEntityServicePacks(ahAPI.COMMON_TOKEN, customerWithServicePacks, TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema({$ref: "schema#/definitions/service_packs"});
    });

    test.each([
        {attribute: "packNo", query: `${sp_prefix}_0020`},
        { attribute: "packNo", query: "0020" }
    ])
    ("Get Entity Service Packs - Search - by $attribute", async ({attribute, query}) => {
        let response = (await ahAPI.getEntityServicePacksWithParams(ahAPI.COMMON_TOKEN,customerWithServicePacks ,"", "", query, "", TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u => u[attribute]).join(",")).toBe(response.body.data.filter(u => u[attribute].includes(query)).map(u => u[attribute]).join(","))
    })


    test("Get Entity Service Packs - Search without results", async () => {
        let response = (await ahAPI.getEntityServicePacksWithParams(ahAPI.COMMON_TOKEN,customerWithServicePacks, "", "", "NONEXISTING", "", TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data).toHaveLength(0)
    })


    test.each([
        { attr:"packNo",order:"asc" },
        { attr:"packNo",order:"desc" },
        { attr:"status",order:"asc" },
        { attr:"status",order:"desc" },
        { attr:"endUser",order:"asc" },
        { attr:"endUser",order:"desc" },
        { attr:"endDate",order:"asc" },
        { attr:"endDate",order:"desc" },
    ])

    (`Get Entity Service Packs - Sorting by $attr in $order order`, async ({attr, order}) => {
        let response =await ahAPI.getEntityServicePacks(ahAPI.COMMON_TOKEN,customerWithServicePacks,TestData.defaultOrgId,`?sortBy=${attr}&sortOrder=${order}`);
        let origOrder:[]= response.body.data.map(t=>( t[attr]?.name!==undefined)?t[attr].name:t[attr]);
        let actualOrderString=origOrder.join(",");
        let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order);
        expect(actualOrderString).toEqual(expectedOrderString);
    })


    test("Get Entity Service Packs - Filter - Status", async () => {
        let response =(await ahAPI.getEntityServicePacksWithParams(ahAPI.COMMON_TOKEN,customerWithServicePacks,"","","","status[]=active",TestData.defaultOrgId));
        expect(response.statusCode).toBe(200)
        expect(response.body.data.map(u=>u.status).join(",")).toBe(response.body.data.filter(u=>u.status.match("active")).map(u=>u.status).join(","))
    })


    test("Get Entity Service Packs - Pagination", async () => {
        const response = await ahAPI.getEntityServicePacks(ahAPI.COMMON_TOKEN,customerWithServicePacks, TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(50)
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    });

    test.each([{ pages:"10" },])
    ("Get Entity Service Packs - Pagination - $pages pages", async ({pages}) => {
        let response =await ahAPI.getEntityServicePacksWithParams(ahAPI.COMMON_TOKEN,customerWithServicePacks,pages,"","","",TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(parseInt(pages))
        expect(response.body.meta.hasNextPage).toBe(true)
        expect(response.body.meta.nextCursor).not.toBeNull();
    })

    test("Get Entity Service Packs - Pagination - Cursor", async () => {
        let entities20 =(await ahAPI.getEntityServicePacksWithParams(ahAPI.COMMON_TOKEN,customerWithServicePacks,"20","","","",TestData.defaultOrgId)).body.data;
        let response=await ahAPI.getEntityServicePacksWithParams(ahAPI.COMMON_TOKEN,customerWithServicePacks,"10","","","",TestData.defaultOrgId);
        let nextCursor=response.body.meta.nextCursor
        let quotesFirst10 =response.body.data;
        let quotesLast10 =(await ahAPI.getEntityServicePacksWithParams(ahAPI.COMMON_TOKEN,customerWithServicePacks,"10",nextCursor,"","",TestData.defaultOrgId)).body.data;
        expect(entities20.map(u=>u.id).join(",")).toContain(quotesFirst10.map(u=>u.id).join(","));
        expect(entities20.map(u=>u.id).join(",")).toContain((quotesLast10.map(u=>u.id)).join(","));
    })

    test("Get Entity Service Packs - Unauthorized", async () => {
        const response = await ahAPI.getEntityServicePacks("blah", customerWithServicePacks,TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    });

    test("Get Entity Service Packs - Unprivileged", async () => {
        let TOKEN=await ahAPI.getUserToken(TestData.defaultViewerUser)
        const response = await ahAPI.getEntityServicePacks(TOKEN, customerWithServicePacks,TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    });

    test("Get Entity Service Packs - Non existing entityId", async () => {
        const response = await ahAPI.getEntityServicePacks(ahAPI.COMMON_TOKEN,  TestData.nonExisingId,TestData.defaultOrgId);
        expect(response.body.data.length).toBe(0);
    });

    test("Get Entity Service Packs - Non existing orgId", async () => {
        const response = await ahAPI.getEntityServicePacks(ahAPI.COMMON_TOKEN, customerWithServicePacks, TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    });
})

