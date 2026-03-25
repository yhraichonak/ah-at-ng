import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import ahDbHelper from "../../api/AHDBHelper";
import * as allure from "allure-js-commons";
let roleToDelete
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));

describe('[jest] Roles', () => {

    let permissionId
    let defaultRolePayload={
        "name": "AT Role",
        "description": "AT Role description",
        "permissionIds":[TestData.orgReadPermissionId],
        "weight": 99
    }
    afterEach(async () => {
        if (roleToDelete !== undefined) {
            await ahAPI.delete_role(ahAPI.COMMON_SA_TOKEN,roleToDelete,TestData.superOrgId)
        }
        await ahAPI.clearCommonSession();
    })
    beforeEach(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
    })
    beforeAll(async () => {
        await ahAPI.getCommonSessionForSA();
        permissionId=(await ahDbHelper.get_permission_id_by_name("organization:read")).id
    })



    test("Roles - Get Permission", async () => {
        let role_id=(await ahAPI.getOrganizationRole("Owner",ahAPI.COMMON_TOKEN, TestData.defaultOrgId))['id']
        let response = await ahAPI.get_role_permissions(ahAPI.COMMON_TOKEN,role_id,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/user_permissions'})
    })

    test.each([
        { role:"Owner", org:TestData.defaultOrgId},
        { role:"Approver",org:TestData.defaultOrgId},
        { role:"Requester",org:TestData.defaultOrgId},
        { role:"Viewer",org:TestData.defaultOrgId},
        { role:"Support Operator",org:TestData.defaultOrgId},
        // { role:"Super Admin",org:TestData.superOrgId},

    ])("Roles - Get Permission -  $role ", async ({role,org}) => {
        let role_id=(await ahAPI.getOrganizationRole(role,ahAPI.COMMON_TOKEN, org))['id']
        let response = await ahAPI.get_role_permissions(ahAPI.COMMON_TOKEN,role_id,org);
        expect(response.body).toEqual(TestData.rolesPermissions[role]);
    })

    test("Roles - Get Permission - Non-existing role", async () => {
        let response = await ahAPI.get_role_permissions(ahAPI.COMMON_TOKEN,TestData.nonExisingId,TestData.defaultOrgId);
        expect(response.statusCode).toBe(404);
    })

    test("Roles - Get Permission - Unauthorized", async () => {
        let role_id=(await ahAPI.getOrganizationRole("Owner",ahAPI.COMMON_TOKEN, TestData.defaultOrgId))['id']
        let response = await ahAPI.get_role_permissions("blah",role_id,TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Roles - Put Permission", async () => {
        let role_id=(await ahAPI.getOrganizationRole("Viewer",ahAPI.COMMON_TOKEN, TestData.defaultOrgId))['id']
        let role_permission = await ahAPI.get_role_permissions(ahAPI.COMMON_TOKEN,role_id,TestData.defaultOrgId);
        role_permission.body["organization"]["update"] = true;
        delete role_permission.body.platform
        let response = await ahAPI.putRolePermissions(ahAPI.COMMON_SA_TOKEN,role_id,TestData.superOrgId,role_permission.body);
        expect(response.statusCode).toBe(200);
        expect(response.body["organization"]["update"]).toBe( true);
    })

    test("Roles - Put Permission - Non-existing role", async () => {
        let response = await ahAPI.putRolePermissions(ahAPI.COMMON_SA_TOKEN,TestData.nonExisingId,TestData.superOrgId,{});
        expect(response.statusCode).toBe(404);
        expect(response.body["message"]).toMatch( /Rolle nicht gefunden/);
    })

    test("Roles - Put Permission - Invalid payload", async () => {
        let role_id=(await ahAPI.getOrganizationRole("Viewer",ahAPI.COMMON_TOKEN, TestData.defaultOrgId))['id']
        let role_permission = await ahAPI.get_role_permissions(ahAPI.COMMON_TOKEN,role_id,TestData.defaultOrgId);
        role_permission.body["organization"]["write"] = true;
        let response = await ahAPI.putRolePermissions(ahAPI.COMMON_SA_TOKEN,role_id,TestData.superOrgId,role_permission.body);
        expect(response.statusCode).toBe(400);
        expect(JSON.stringify(response.body["message"].toString())).toMatch( /Unrecognized key\(s\) in object/);
    })
    test("Roles - Put Permission - Unauthorized", async () => {
        let role_id=(await ahAPI.getOrganizationRole("Viewer",ahAPI.COMMON_TOKEN, TestData.defaultOrgId))['id']
        let response = await ahAPI.putRolePermissions("blah",role_id,TestData.defaultOrgId,{});
        expect(response.statusCode).toBe(401);
    })

    test("Roles - Get Organizations Roles", async () => {
        let response = await ahAPI.get_organizations_roles(ahAPI.COMMON_TOKEN,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toMatchSchema( {$ref: 'schema#/definitions/organization_roles'})
    })



    test("Roles - Create Role - Single permission", async () => {
        let payload={
            "name": "AT Role",
            "description": "AT Role description",
            "permissionIds":[TestData.orgReadPermissionId],
            "weight": 99
        }
        let response = await ahAPI.post_roles(ahAPI.COMMON_SA_TOKEN,payload,TestData.superOrgId);
        expect(response.statusCode).toBe(201);
        expect(response.body.name).toBe( payload.name)
        expect(response.body.description).toBe( payload.description)
        expect(response.body.weight).toBe( payload.weight)
        roleToDelete=response.body.id
    })

    test("Roles - Create Role - Multiple permission", async () => {
        let roleId1=(await ahDbHelper.get_permission_id_by_name("organization:read")).id
        let reoleId2=(await ahDbHelper.get_permission_id_by_name("quote:read")).id
        let payload={
            "name": "AT Role",
            "description": "AT Role descrption",
            "permissionIds":[roleId1,reoleId2],
            "weight": 99
        }
        let response = await ahAPI.post_roles(ahAPI.COMMON_SA_TOKEN,payload,TestData.superOrgId);
        expect(response.statusCode).toBe(201);
        expect(response.body.name).toBe( payload.name)
        expect(response.body.description).toBe( payload.description)
        expect(response.body.weight).toBe( payload.weight)
        roleToDelete=response.body.id
    })

    test.each([
        { payload:{"name":""}, description:"Empty name", message:"name: String must contain at least 1 character"},
        { payload:{"name":"AT Role"}, description:"Empty permissions", message:"permissionIds: Required"},
    ])("Roles - Create Role - Negative - $description", async ({payload, message}) => {
        let response = await ahAPI.post_roles(ahAPI.COMMON_SA_TOKEN,payload,TestData.superOrgId);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(message);
    })

    test("Roles - Create Role - Unauthorized", async () => {
        let payload={ "name": "AT Role","weight": 99,
                       "description": "AT Role description",
                       "permissionIds":[TestData.orgReadPermissionId],}
        let response = await ahAPI.post_roles("BLAH", payload,TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Roles - Create Role - Lack of Privileges", async () => {
        let TOKEN = await ahAPI.getUserToken(TestData.defaultViewerDetails)
        let payload={ "name": "AT Role","weight": 99,
            "description": "AT Role description",
            "permissionIds":[TestData.orgReadPermissionId],}
        let response = await ahAPI.post_roles(TOKEN, payload,TestData.defaultOrgId);
        expect(response.statusCode).toBe(403);
    })

    test("Roles - Create Role - Invalid orgId", async () => {
        let payload={ "name": "AT Role","weight": 99,
            "description": "AT Role description",
            "permissionIds":[TestData.orgReadPermissionId],}
        let response = await ahAPI.post_roles(ahAPI.COMMON_TOKEN, payload,"blah");
        expect(response.statusCode).toBe(400);
    })


    test("Roles - Update Role", async () => {
        let payload={
            "name": "AT Role",
            "description": "AT Role description",
            "permissionIds":[TestData.orgReadPermissionId],
            "weight": 99
        }
        let response = await ahAPI.post_roles(ahAPI.COMMON_SA_TOKEN,payload,TestData.superOrgId);
        roleToDelete=response.body.id
        payload.description= "edited description"
        response = await ahAPI.patch_role(ahAPI.COMMON_SA_TOKEN,roleToDelete, payload, TestData.superOrgId);
        expect(response.statusCode).toBe(201);
        expect(response.body.description).toBe( payload.description)
        expect(response.body.weight).toBe( payload.weight)
    })

    test("Roles - Update Role - Add Permissions", async () => {
        let payload={
            "name": "AT Role",
            "description": "AT Role description",
            "permissionIds":[TestData.orgReadPermissionId],
        }
        let response = await ahAPI.post_roles(ahAPI.COMMON_SA_TOKEN,payload,TestData.superOrgId);
        roleToDelete=response.body.id
        payload.permissionIds=[TestData.quoteReadPermissionId]
        response = await ahAPI.patch_role(ahAPI.COMMON_SA_TOKEN,roleToDelete, payload, TestData.superOrgId);
        expect(response.statusCode).toBe(201);
    })

    test.each([
        { payload:{"name":"o", "permissionIds":[TestData.orgReadPermissionId]}, description:"Empty name", message:"No values to set"},
        { payload:{"name":"AT Role","permissionIds":[]}, description:"Empty permissions", message:"permissionIds: Array must contain at least 1 element"},
    ])("Roles - Update Role - Negative - $description", async ({payload, message}) => {
        let newPermPayload={
            "name": "AT Role",
            "description": "AT Role description",
            "permissionIds":[TestData.orgReadPermissionId],
        }
        await allure.issue('AH-1077')
        let response = await ahAPI.post_roles(ahAPI.COMMON_SA_TOKEN,newPermPayload,TestData.defaultOrgId);
        roleToDelete=response.body.id
         response = await ahAPI.patch_role(ahAPI.COMMON_SA_TOKEN,roleToDelete,payload,TestData.defaultOrgId);
        expect([400,500]).toContain(response.statusCode);
        expect(response.body.message).toMatch(message);
    })


    test("Roles - Update Role - Unauthorized", async () => {
        let payload={
            "name": "AT Role", "description": "AT Role description",
            "permissionIds":[TestData.orgReadPermissionId]}
        let response = await ahAPI.post_roles(ahAPI.COMMON_TOKEN,payload,TestData.defaultOrgId);
        roleToDelete=response.body.id
        payload.name= "edited name"
        response = await ahAPI.patch_role("BLAH",roleToDelete, payload, TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Roles - Update Role - Lack of Privileges", async () => {
        let TOKEN = await ahAPI.getUserToken(TestData.defaultViewerDetails)
        let payload={
            "name": "AT Role", "description": "AT Role description",
            "permissionIds":[TestData.orgReadPermissionId]}
        let response = await ahAPI.post_roles(ahAPI.COMMON_TOKEN,payload,TestData.defaultOrgId);
        roleToDelete=response.body.id
        payload.name= "edited name"
        response = await ahAPI.patch_role(TOKEN,roleToDelete, payload, TestData.defaultOrgId);
        expect(response.statusCode).toBe(403);
    })

    test("Roles - Delete", async () => {
        let response = await ahAPI.post_roles(ahAPI.COMMON_SA_TOKEN,defaultRolePayload,TestData.superOrgId);
        roleToDelete=response.body.id
        response = await ahAPI.delete_role(ahAPI.COMMON_SA_TOKEN,roleToDelete,TestData.superOrgId);
        expect(response.statusCode).toBe(200);
    })


    test("Roles - Delete - Unauthorized", async () => {
        let response = await ahAPI.post_roles(ahAPI.COMMON_TOKEN,defaultRolePayload,TestData.defaultOrgId);
        roleToDelete=response.body.id
        response = await ahAPI.delete_role("BLAH",roleToDelete,TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })


    test("Roles - Delete - Lack Privileges", async () => {
        let TOKEN= await ahAPI.getUserToken(TestData.defaultViewerDetails)
        let response = await ahAPI.post_roles(ahAPI.COMMON_TOKEN,defaultRolePayload,TestData.defaultOrgId);
        roleToDelete=response.body.id
        response = await ahAPI.delete_role(TOKEN,roleToDelete,TestData.defaultOrgId);
        expect(response.statusCode).toBe(403);
    })
})

