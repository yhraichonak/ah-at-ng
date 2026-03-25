import ahAPI from "../../api/SupertestAHAPIHelper";
import TestData from "../testdata";
import supertestAHAPIHelper from "../../api/SupertestAHAPIHelper";
import ahDbHelper from "../../api/AHDBHelper";
import * as allure from "allure-js-commons";
const { matchersWithOptions } = require('jest-json-schema');
expect.extend(matchersWithOptions({schemas: [TestData.schema]}))
let testAsset=TestData.TEST_CONTRACT_ASSET_MAP["dump"]
let testContract=TestData.TEST_CONTRACT_MAP["dump"]
let testEntity=TestData.defaultEndUserDetails
let testQuote=TestData.TEST_QUOTE_MAP["dump"]

let defaultRoleId, allOnRoleId, allOffRoleId
afterEach(async () => {await ahAPI.clearCommonSession();})
beforeEach(async () => { await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
beforeAll(async () => {
    // await TestData.initUsersAndRoles()
    await ahAPI.getCommonSessionForSA();
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
    defaultRoleId=(await ahAPI.getOrganizationRole(TestData.defaultPermissionRole,ahAPI.COMMON_TOKEN, TestData.defaultOrgId))['id']
    allOnRoleId=(await ahAPI.getOrganizationRole(TestData.defaultPermissionRoleAllOn,ahAPI.COMMON_TOKEN, TestData.defaultOrgId))['id']
    allOffRoleId=(await ahAPI.getOrganizationRole(TestData.defaultPermissionRoleAllOff,ahAPI.COMMON_TOKEN, TestData.defaultOrgId))['id']
})
describe('[jest] Permissions', () =>
{
    test.each([
        { url: `/quotes/${TestData.foreignQuote}`, orgId:TestData.foreignOrgId ,descr:"Foreign Quote"},
        { url: `/contracts/${TestData.foreignContract}`,orgId:TestData.foreignOrgId , descr:"Foreign Contract"},
        { url: `/assets/${TestData.foreignAsset}`,orgId:TestData.foreignOrgId ,descr:"Foreign Asset"},
        { url: `/service-packs/${TestData.foreignServicePack}`,orgId:TestData.foreignOrgId ,descr:"Foreign Service Pack"},
        { url: "/admin/organizations",orgId:TestData.foreignOrgId ,descr:"Admin Organization"},
        { url: "/admin/users",orgId:TestData.foreignOrgId ,descr:"Admin Users"}
    ])(`Can't access item from another organization - $descr`, async ({url,orgId}) => {
         let TOKEN= await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
         let resp= await supertestAHAPIHelper.getUrl(TOKEN,url, TestData.defaultOrgId)
         expect(resp.statusCode).toBe(404);
         resp= await supertestAHAPIHelper.getUrl(TOKEN,url, orgId)
         expect([403,404]).toContain(resp.statusCode);
    })


    test.each([
        { permissions:["quote:read","entity:read","asset:read","quote_item:read"], url: `/quotes/${TestData.defaultQWCQuoteId}`, code:200, descr:"Grant permission"},
        { permissions:["contract:read","entity:read","asset:read","contract_item:read"], url: `/quotes/${TestData.defaultQWCQuoteId}`, code:403, descr: "Restrict permission"},
    ])(`Verify GET access - Change permission = $descr`, async ({permissions,url, code}) => {
        let permissionIds=[]
        for (let i=0;i<permissions.length; i++){
            permissionIds.push((await ahDbHelper.get_permission_id_by_name(permissions[i])).id)
        }
        let payload={
            "description": "",
            "permissionIds":permissionIds}
        let response = await ahAPI.patch_role(ahAPI.COMMON_SA_TOKEN,defaultRoleId,payload,TestData.defaultOrgId);
        expect(response.statusCode).toBe(201)
        let PERMISSION_TOKEN=await ahAPI.getUserToken(TestData.defaultPermissionUserDetails);
        let resp= await supertestAHAPIHelper.getUrl(PERMISSION_TOKEN,url, TestData.defaultOrgId)
        expect(resp.statusCode).toBe(code);
        expect(resp.body).not.toBeNull();
    })


    describe('Granted permission', () => {

        test.each([
            {url: `/quotes/`},
            {url: `/quotes/${TestData.defaultQWCQuoteId}`},
            {url: `/organizations/admin/all`,orgId:TestData.defaultOrgId},
            {url: `/organizations/${TestData.defaultOrgId}/entities`},
            {url: `/users`,orgId:TestData.superOrgId},
            {url: `/users/${TestData.defaultUserId}`,orgId:TestData.superOrgId},
            {url: `/assets/${testAsset.serialNumber}`},
            {url: `/assets/warranty/${testAsset.serialNumber}/${testAsset.productSku}`,orgId:TestData.defaultOrgId },
            {url: `/assets/${testAsset.serialNumber}/contracts`},
            {url: `/assets/${testAsset.serialNumber}/quotes`},
            {url: `/contracts`},
            {url: `/contracts/batch-download-pdf`, respCode:400},
            {url: `/contracts/${testContract.id}`},
            {url: `/contracts/${TestData.contractWithPreview}/pdf?printName=Quote Netto`,orgId:TestData.previewPDFOrgId},
            {url: `/contracts/${testContract.id}/assets`},
            {url: `/contracts/${testContract.id}/contacts`},
            {url: `/contracts/${testContract.id}/quotes`},
            {url: `/contracts/${testContract.id}/entities`},
            {url: `/customers`},
            {url: `/customers/${TestData.defaultCustomerDetails.id}/contacts`},
            {url: `/entities`},
            {url: `/entities/${testEntity.id}`},
            {url: `/entities/${testEntity.id}/assets`},
            {url: `/entities/${testEntity.id}/contracts`},
            {url: `/entities/${testEntity.id}/quotes`},
            // {url: `/entities/${testEntity.id}/contacts`},
            {url: `/entities/${testEntity.id}/assets/export`},
            {url: `/entities/${testEntity.id}/service-packs`},
            {url: `/quotes/requests`},
            {url: `/quotes/requests/${TestData.defaultQuoteRequestId}`},
            {url: `/quotes`},
            {url: `/quotes/${testQuote.id}`},
            {url: `/quotes/${TestData.defaultQuoteWithPDFId}/pdf`,orgId:TestData.previewPDFOrgId,},
            {url: `/quotes/${testQuote.id}/assets`},
            {url: `/quotes/${testQuote.id}/contracts`},
            {url: `/quotes/${testQuote.id}/contacts`},
            {url: `/quotes/${testQuote.id}/assets/export`},
            {url: `/quotes/${testQuote.id}/requests`},
            {url: `/quotes/${testQuote.id}/entities`},
            {url: `/service-packs`,orgId:TestData.previewPDFOrgId},
            {url: `/service-packs/${TestData.defaultServicePack.id}`},
            {url: `/roles/organizations/${TestData.defaultOrgId}`},
            {url: `/roles/${TestData.superAdminRoleId}/permissions`},

        ])(`Verify GET access - Grant access $url`, async ({url,orgId=TestData.defaultOrgId,respCode=200 }) => {
            let TOKEN= await ahAPI.getUserToken(TestData.allOnPermissionUserDetails);
            let resp= await supertestAHAPIHelper.getUrl(TOKEN,url, orgId)
            expect(resp.statusCode).toBe(respCode);
            expect(resp.body).not.toBeNull();
        },60000)

        test.each([
            {url: `/organizations`,requestType:"POST",code:400},
            {url: `/organizations/${TestData.defaultOrgId}`,requestType:"PATCH"},
            {url: `/organizations/${TestData.defaultOrgId}/entity`,requestType:"POST"},
            {url: `/organizations/${TestData.defaultOrgId}/entities`,requestType:"POST",},
            {url: `/users/invite`,requestType:"POST"},
            {url: `/users/invite/resend`,requestType:"POST"},
            {url: `/users/disable`,requestType:"POST"},
            {url: `/users/enable`,requestType:"POST"},
            {url: `/users/unlink`,requestType:"POST"},
            {url: `/users/invited/remove`,requestType:"POST"},
            {url: `/users/${TestData.defaultUserId}`,requestType:"POST", code:404},
            {url: `/users/${TestData.defaultUserId}/roles`,requestType:"POST"},
            {url: `/contracts/request-quote`,requestType:"POST"},
            {url: `/contracts`,requestType:"POST"},
            {url: `/contracts/assets`,requestType:"POST"},
            {url: `/customers`,requestType:"POST"},
            {url: `/customers/${TestData.defaultCustomerContact.id}/contacts`,requestType: "POST"},
            {url: `/quotes/${TestData.defaultQWCQuoteId}/approve`,requestType:"POST"},
            {url: `/quotes/${TestData.defaultQWCQuoteId}/decline`,requestType:"POST"},
            {url: `/quotes/${TestData.defaultQWCQuoteId}/change-request`,requestType:"POST"},
            {url: `/quotes`,requestType:"POST"},
            {url: `/service-packs/many`,requestType:"POST"},
            {url: `/service-packs`,requestType:"POST"},
            {url: `/service-packs/${TestData.defaultServicePack.id}`,requestType:"PATCH"},
            {url: `/roles`,requestType:"POST"},
            {url: `/roles/${TestData.ownerRoleId}`,requestType:"PATCH"},
            {url: `/roles/${TestData.ownerRoleId}/permissions`,requestType:"PUT"},

        ])(`Verify granted access $requestType $url`, async ({url,requestType, code=400}) => {
            let TOKEN= await ahAPI.getUserToken(TestData.allOnPermissionUserDetails);
            let resp= await supertestAHAPIHelper.sendUrl(TOKEN,requestType, url,null,TestData.defaultOrgId)
            expect(resp.statusCode).toBe(code);
        })
    })

    describe('Restricted permission', () => {

        test.each([
            {url: `/quotes/`},
            {url: `/quotes/${TestData.defaultQWCQuoteId}`},
            {url: `/organizations/admin/all`,orgId:TestData.defaultOrgId},
            {url: `/organizations/${TestData.defaultOrgId}/entities`},
            {url: `/users`,orgId:TestData.superOrgId},
            {url: `/users/${TestData.defaultUserId}`,orgId:TestData.superOrgId},
            {url: `/assets/${testAsset.serialNumber}`},
            {url: `/assets/warranty/${testAsset.serialNumber}/${testAsset.productSku}`,orgId:TestData.defaultOrgId },
            {url: `/assets/${testAsset.serialNumber}/contracts`},
            {url: `/assets/${testAsset.serialNumber}/quotes`},
            {url: `/contracts`},
            {url: `/contracts/${testContract.id}`},
            {url: `/contracts/${TestData.contractWithPreview}/pdf`,orgId:TestData.previewPDFOrgId},
            {url: `/contracts/${testContract.id}/assets`},
            {url: `/contracts/${testContract.id}/contacts`},
            {url: `/contracts/${testContract.id}/quotes`},
            {url: `/contracts/${testContract.id}/entities`},
            {url: `/customers`},
            {url: `/customers/${TestData.defaultCustomerDetails.id}/contacts`},
            {url: `/entities`},
            {url: `/entities/${testEntity.id}`},
            {url: `/entities/${testEntity.id}/assets`},
            {url: `/entities/${testEntity.id}/contracts`},
            {url: `/entities/${testEntity.id}/quotes`},
            // {url: `/entities/${testEntity.id}/contacts`},
            {url: `/entities/${testEntity.id}/assets/export`},
            {url: `/entities/${testEntity.id}/service-packs`},
            {url: `/quotes/requests`},
            {url: `/quotes/requests/${TestData.defaultQuoteRequestId}`},
            {url: `/quotes`},
            {url: `/quotes/${testQuote.id}`},
            {url: `/quotes/${TestData.defaultQuoteWithPDFId}/pdf`,orgId:TestData.previewPDFOrgId,},
            {url: `/quotes/${testQuote.id}/assets`},
            {url: `/quotes/${testQuote.id}/contracts`},
            {url: `/quotes/${testQuote.id}/contacts`},
            {url: `/quotes/${testQuote.id}/assets/export`},
            {url: `/quotes/${testQuote.id}/requests`},
            {url: `/quotes/${testQuote.id}/entities`},
            {url: `/service-packs`,orgId:TestData.previewPDFOrgId},
            {url: `/service-packs/${TestData.defaultServicePack.id}`},
        ])(`Verify GET access - Restricted access $url`, async ({url,orgId=TestData.defaultOrgId}) => {
            let TOKEN= await ahAPI.getUserToken(TestData.allOffPermissionUserDetails);
            let resp= await supertestAHAPIHelper.getUrl(TOKEN,url, orgId)
            expect([404,403]).toContain(resp.statusCode);
        })

        test.each([
            {url: `/roles/organizations/${TestData.superOrgId}`},
            {url: `/roles/${TestData.superAdminRoleId}/permissions`},
        ])(`Verify GET access - Restricted access 2 $url`, async ({url}) => {
            let TOKEN= await ahAPI.getUserToken(TestData.defaultViewerDetails);
            let resp= await supertestAHAPIHelper.getUrl(TOKEN,url, TestData.defaultOrgId)
            expect([404,403]).toContain(resp.statusCode);
        })

        test.each([
            {url: `/organizations`,requestType:"POST"},
            {url: `/organizations/${TestData.defaultOrgId}`,requestType:"PATCH"},
            {url: `/organizations/${TestData.defaultOrgId}`,requestType:"POST", code:404},
            {url: `/organizations/${TestData.defaultOrgId}/entity`,requestType:"POST"},
            {url: `/organizations/${TestData.defaultOrgId}/entities`,requestType:"POST",},
            {url: `/users/invite`,requestType:"POST"},
            {url: `/users/invite/resend`,requestType:"POST"},
            {url: `/users/disable`,requestType:"POST"},
            {url: `/users/enable`,requestType:"POST"},
            {url: `/users/unlink`,requestType:"POST"},
            {url: `/users/invited/remove`,requestType:"POST"},
            {url: `/users/${TestData.defaultUserId}`,requestType:"POST", code:404},
            {url: `/users/${TestData.defaultUserId}/roles`,requestType:"POST"},
            {url: `/contracts/request-quote`,requestType:"POST"},
            {url: `/contracts`,requestType:"POST"},
            {url: `/contracts/assets`,requestType:"POST"},
            {url: `/customers`,requestType:"POST"},
            {url: `/customers/${TestData.defaultCustomerContact.id}/contacts`,requestType: "POST"},
            {url: `/quotes/${TestData.defaultQWCQuoteId}/approve`,requestType:"POST"},
            {url: `/quotes/${TestData.defaultQWCQuoteId}/decline`,requestType:"POST"},
            {url: `/quotes/${TestData.defaultQWCQuoteId}/change-request`,requestType:"POST"},
            {url: `/quotes`,requestType:"POST"},
            {url: `/service-packs/many`,requestType:"POST"},
            {url: `/service-packs`,requestType:"POST"},
            {url: `/service-packs/import`,requestType:"POST"},
            {url: `/service-packs/${TestData.defaultServicePack.id}`,requestType:"DELETE"},
            {url: `/service-packs/${TestData.defaultServicePack.id}`,requestType:"PATCH"},
            {url: `/roles`,requestType:"POST"},
            {url: `/roles/${TestData.ownerRoleId}`,requestType:"PATCH"},
            {url: `/roles/${TestData.ownerRoleId}`,requestType:"DELETE"},
            {url: `/roles/${TestData.ownerRoleId}/permissions`,requestType:"PUT"},

        ])(`Verify restricted access $requestType $url`, async ({url,requestType, code=403}) => {
            let TOKEN= await ahAPI.getUserToken(TestData.allOffPermissionUserDetails);
            let resp= await supertestAHAPIHelper.sendUrl(TOKEN,requestType, url,null,TestData.defaultOrgId)
            expect(resp.statusCode).toBe(code);
        })
    })
})