import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import commonHelper from "../../api/CommonHelper";
import {test} from "@jest/globals";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
describe('[jest] Entities', () => {

    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        await ahAPI.getCommonSessionForSA();})
    beforeAll(async () => {
    })

    test("Entities - Get entities", async () => {
        let response =await ahAPI.getEntities(ahAPI.COMMON_SA_TOKEN,TestData.superOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/entities'})
    })

    test("Entities - Get entities - Info", async () => {
        let response =await ahAPI.getEntities(ahAPI.COMMON_SA_TOKEN,TestData.superOrgId,"?limit=1000");
        expect(response.statusCode).toBe(200);
        let distributorDetails=TestData.defaultSADistributorDetails;
        let targetDetails=response.body.data.find(t=> t["name"]===distributorDetails["name"])
        expect(targetDetails.id).toEqual(distributorDetails["id"]);
        expect(targetDetails.name).toEqual(distributorDetails["name"]);
        expect(targetDetails.type).toEqual(distributorDetails["type"]);
    })

    test("Entities - Get entities - Unauthorized", async () => {
        let response =await ahAPI.getEntities("blah",TestData.superOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Entities - Get entities - invalid orgId", async () => {
        let response =await ahAPI.getEntities(ahAPI.COMMON_SA_TOKEN,"blah");
        expect(response.statusCode).toBe(400);
    })

    test("Entities - Get entity details", async () => {
        let response =await ahAPI.getEntityDetails(ahAPI.COMMON_SA_TOKEN,TestData.defaultEndUserDetails["id"],TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/entity_summary'})
    })

    test("Entities - Get entity details - Info", async () => {
        let response =await ahAPI.getEntityDetails(ahAPI.COMMON_TOKEN,TestData.defaultEndUserDetails["id"],TestData.defaultOrgId);
        expect(response.body.id).toEqual(TestData.defaultEndUserDetails["id"]);
        expect(response.body.name).toEqual(TestData.defaultEndUserDetails["name"]);
        expect(response.body.type).toEqual(TestData.defaultEndUserDetails["type"]);
    })

    test("Entities - Get entity details - Unauthorized", async () => {
        let response =await ahAPI.getEntityDetails("blah",TestData.defaultEndUserDetails["id"], TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Entities - Get entity details - invalid orgId", async () => {
        let response =await ahAPI.getEntityDetails(ahAPI.COMMON_SA_TOKEN,TestData.defaultEndUserDetails["id"], TestData.nonExisingId);
        expect([404,403]).toContain(response.statusCode);
    })

    test("Entities - Get entity details - invalid entityId", async () => {
        let response =await ahAPI.getEntityDetails(ahAPI.COMMON_SA_TOKEN,TestData.nonExisingId, TestData.defaultOrgId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(new RegExp(`${TestData.errorMessages['CUSTOMER_NOT_FOUND']}`));
    })


    test("Entities - Get entity info", async () => {
        let response =await ahAPI.getEntity(ahAPI.COMMON_SA_TOKEN,TestData.defaultEndUserDetails["id"],TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/entity_summary'})
        expect(response.body.name).toMatch( TestData.defaultEndUserDetails["name"])
    })

    test("Entities - Get entity info - Unknown entity Id", async () => {
        let response =await ahAPI.getEntity(ahAPI.COMMON_TOKEN,TestData.nonExisingId,TestData.defaultOrgId);
        expect(response.statusCode).toBe(404);
    })

    test("Entities - Get entity info - Unknown org Id", async () => {
        let response =await ahAPI.getEntity(ahAPI.COMMON_TOKEN,TestData.defaultEndUserDetails.id,TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    })

    test("Entities - Get entity info - Unauthorized", async () => {
        let response =await ahAPI.getEntity("BLAH",TestData.defaultEndUserDetails["id"],TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test.each([
        {entityType:"Distributor", entityName:TestData.defaultDistributorDetails["name"]},
        {entityType:"Reseller", entityName:TestData.defaultOrganizationEntityDetails["name"]},
        {entityType:"EndUser", entityName:TestData.defaultCustomerDetails["name"]},
        {entityType:"Vendor", entityName:TestData.defaultDistributorVendorDetails["name"]},

    ])
    ("Entities - Get distinct names - $entityType", async ({entityType,entityName}) => {
        let response = await ahAPI.getEntitiesDistinctNames(ahAPI.COMMON_TOKEN, TestData.defaultOrgId,"?type="+entityType);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.filter(t=>t==entityName).length).toBe(1);
    })

    test("Entities - Get distinct - Invalid filter", async () => {
        let response = await ahAPI.getEntitiesDistinctNames(ahAPI.COMMON_TOKEN, TestData.defaultOrgId,"?type=BLAH");
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(`Invalid enum value. Expected 'Vendor' \| 'Distributor' \| 'Reseller' \| 'EndUser'`);
    })

    test("Entities - Get distinct names - Unauthorized", async () => {
        let response =await ahAPI.getEntitiesDistinctNames("blah",TestData.superOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Entities - Get distinct names - invalid orgId", async () => {
        let response =await ahAPI.getEntitiesDistinctNames(ahAPI.COMMON_SA_TOKEN,"blah");
        expect(response.statusCode).toBe(400);
    })
})

