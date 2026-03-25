import ahAPI from "../../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let viewer_role_id,owner_role_id
describe('[jest] Users', () => {
    let testuser=TestData.restrictedAltUserDetails
    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        viewer_role_id=(await ahAPI.getOrganizationRole("Viewer",ahAPI.COMMON_TOKEN, TestData.defaultOrgId))['id']
        owner_role_id= (await ahAPI.getOrganizationRole("Owner",ahAPI.COMMON_TOKEN, TestData.defaultOrgId))['id']
        await TestData.initUsersAndRoles()
    })

describe('User Details', () => {
    test("User - Get User", async () => {
        let response = await ahAPI.get_user(ahAPI.COMMON_TOKEN,TestData.defaultEditUserDetails["id"]);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/user_details'})
    })

    test("User - Get User Details", async () => {
        let testUser= (await ahAPI.getUserDetails(TestData.defaultUserDetails))
        let response = await ahAPI.get_user(ahAPI.COMMON_TOKEN,testUser.id);
        expect(response.statusCode).toBe(200);
        expect(response.body.isActive).toEqual(testUser.isActive);
        expect(response.body.email).toEqual(testUser.email);
        expect(response.body.firstName).toEqual(testUser.firstName);
        expect(response.body.lastName).toEqual(testUser.lastName);
    })

    test("User - Get User - Unauthorized", async () => {
        let user_id=(await ahAPI.getUserDetails(TestData.defaultEditUserDetails))['id']
        let response = await ahAPI.get_user("blah",user_id);
        expect(response.statusCode).toBe(401);
    })

    test("User - Get User - Non-existing userId", async () => {
        let response = await ahAPI.get_user(ahAPI.COMMON_TOKEN,TestData.nonExisingId);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("\"Benutzer nicht gefunden\"");
    })

    test("User - Post User - Roles", async () => {
        let role_id=(await ahAPI.getOrganizationRole("Owner",ahAPI.COMMON_TOKEN, TestData.defaultOrgId))['id']
        let response = await ahAPI.postUserRoles(ahAPI.COMMON_TOKEN,TestData.defaultEditUserDetails['id'],role_id,TestData.defaultOrgId);
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe("Role assigned successfully")
    })

    test("User - Post User - Roles - Non-existing user", async () => {
        let role_id=(await ahAPI.getOrganizationRole("Owner",ahAPI.COMMON_TOKEN, TestData.defaultOrgId))['id']
        let response = await ahAPI.postUserRoles(ahAPI.COMMON_TOKEN,TestData.nonExisingId,role_id,TestData.defaultOrgId);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("\"Benutzer nicht gefunden\"")
    })
    test("User - Post User - Roles - Non-existing role", async () => {
        let response = await ahAPI.postUserRoles(ahAPI.COMMON_TOKEN,TestData.defaultEditUserDetails['id'],TestData.nonExisingId,TestData.defaultOrgId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe("\"Rolle nicht gefunden\"")
    })
    test("User - Post User - Roles - Unauthorized", async () => {
        let role_id=(await ahAPI.getOrganizationRole("Owner",ahAPI.COMMON_TOKEN, TestData.defaultOrgId))['id']
        let response = await ahAPI.postUserRoles("bllah",TestData.defaultEditUserDetails['id'],role_id,TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })
})

    describe("User - Unlink", ()=>{

    test.each([
        {user:TestData.saUserDetails, role:"Super Admin"},
        {user:TestData.defaultAdminDetails, role:"Owner"},
        {user:TestData.defaultOperatorDetails, role:"Operator"}
         ])
    ("User - Unlink as $role", async ({user, role}) => {
        let TOKEN= await ahAPI.getUserToken(user);
        await ahAPI.invite(ahAPI.COMMON_TOKEN, testuser.email, viewer_role_id, TestData.defaultOrgId);
        let response = await ahAPI.unlinkUser(TOKEN,testuser['id'],viewer_role_id,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("User unlinked successfully")
    })

    test("User - Unlink - Unauthorized", async () => {
        await ahAPI.invite(ahAPI.COMMON_TOKEN, testuser.email, viewer_role_id, TestData.defaultOrgId);
        let response = await ahAPI.unlinkUser("BLAH",testuser['id'],viewer_role_id,TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("User - Unlink - Non-Existing org", async () => {
        await ahAPI.invite(ahAPI.COMMON_TOKEN, testuser.email, viewer_role_id, TestData.defaultOrgId);
        let response = await ahAPI.unlinkUser(ahAPI.COMMON_TOKEN,testuser['id'],viewer_role_id,TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
    })

    test("User - Unlink - Non-Existing role", async () => {
        await ahAPI.invite(ahAPI.COMMON_TOKEN, testuser.email, viewer_role_id, TestData.defaultOrgId);
        let response = await ahAPI.unlinkUser(ahAPI.COMMON_TOKEN,testuser['id'],TestData.nonExisingId,TestData.defaultOrgId);
        expect(response.statusCode).toBe(404);
    })

    test("User - Unlink - Non-Existing userId", async () => {
        let response = await ahAPI.unlinkUser(ahAPI.COMMON_TOKEN,TestData.nonExisingId,viewer_role_id,TestData.defaultOrgId);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(/Benutzer nicht gefunden/);
    })

    test("User - Unlink - Unprivileged", async () => {
        let TOKEN= await ahAPI.getUserToken(TestData.defaultViewerDetails)
        let response = await ahAPI.unlinkUser(TOKEN,testuser['id'],viewer_role_id,TestData.defaultOrgId);
        expect(response.statusCode).toBe(403);
    })
})

describe("User - Update", ()=>{

    test.each([{user:TestData.saUserDetails, role:"Super Admin"},
               {user:TestData.defaultAdminDetails, role:"Owner"},
               {user:TestData.defaultOperatorDetails, role:"Operator"}])
        ("User - Update Role as $role", async ({user, role}) => {
            let TOKEN= await ahAPI.getUserToken(user);
            await ahAPI.invite(ahAPI.COMMON_TOKEN, testuser.email, viewer_role_id, TestData.defaultOrgId);
            let response = await ahAPI.postUserRoles(TOKEN,testuser['id'],owner_role_id,TestData.defaultOrgId);
            expect(response.statusCode).toBe(201);
            expect(response.body.message).toMatch(/Role assigned successfully/)
        },20000)

        test("User - Update Role - Unprivileged", async () => {
            let TOKEN= await ahAPI.getUserToken(TestData.defaultViewerDetails)
            let response = await ahAPI.postUserRoles(TOKEN,testuser['id'],owner_role_id,TestData.defaultOrgId);
            expect(response.statusCode).toBe(403);
        })

        test("User - Update Role - Unauthorized", async () => {
            await ahAPI.invite(ahAPI.COMMON_TOKEN, testuser.email, viewer_role_id, TestData.defaultOrgId);
            let response = await ahAPI.postUserRoles("BLAH",testuser['id'],owner_role_id,TestData.defaultOrgId);
            expect(response.statusCode).toBe(401);
        })

        test("User - Update Role - Non-Existing org", async () => {
            await ahAPI.invite(ahAPI.COMMON_TOKEN, testuser.email, viewer_role_id, TestData.defaultOrgId);
            let response = await ahAPI.postUserRoles(ahAPI.COMMON_TOKEN,testuser['id'],owner_role_id,TestData.nonExisingId);
            expect(response.statusCode).toBe(403);
        })

        test("User - Update Role - Non-Existing role", async () => {
            await ahAPI.invite(ahAPI.COMMON_TOKEN, testuser.email, viewer_role_id, TestData.defaultOrgId);
            let response = await ahAPI.postUserRoles(ahAPI.COMMON_TOKEN,testuser['id'],TestData.nonExisingId,TestData.defaultOrgId);
            expect(response.statusCode).toBe(404);
        },10000)

        test("User - Update Role - Non-Existing userId", async () => {
            let response = await ahAPI.postUserRoles(ahAPI.COMMON_TOKEN,TestData.nonExisingId,viewer_role_id,TestData.defaultOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toMatch(/Benutzer nicht gefunden/);
        })

    })

    describe("User - Change Email", ()=>{
        let new_email, users
        beforeEach(async () => {
             users=await ahAPI.findUsersByEmails(`.*${TestData.defaultChangeUserEmail.email}|${TestData.altChangeUserEmail.email}.*`,"?search=at_email")
            if (users.length==2)throw Error("Both email edit users are present in the system - manual resolve required")
            if (users.length==0)throw Error("Non email edit users are present in the system - manual resolve required")
            new_email=(users[0].email == TestData.defaultChangeUserEmail.email)?TestData.altChangeUserEmail.email:TestData.defaultChangeUserEmail.email;
        })

        test("Change Email - Positive", async () => {
            let response = await ahAPI.changeUserEmail(ahAPI.COMMON_SA_TOKEN,users[0].id,new_email,TestData.superOrgId);
            expect(response.statusCode).toBe(200);
        })

        test("Change Email - Existing email", async () => {
            let response = await ahAPI.changeUserEmail(ahAPI.COMMON_SA_TOKEN,users[0].id,TestData.defaultUserDetails.email,TestData.superOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toMatch("Ein Benutzer mit derselben E-Mail-Adresse existiert bereits");
        })

        test("Change Email - Invalid email", async () => {
            let response = await ahAPI.changeUserEmail(ahAPI.COMMON_SA_TOKEN,users[0].id,"blah",TestData.superOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toContain('Invalid email');
        })

        test("Change Email - Unauthorized", async () => {
            let response = await ahAPI.changeUserEmail("BLAH",users[0].id,new_email,TestData.superOrgId);
            expect(response.statusCode).toBe(401);
        })

        test("Change Email - Unprivileged", async () => {
            let response = await ahAPI.changeUserEmail(ahAPI.COMMON_TOKEN,users[0].id,new_email,TestData.defaultOrgId);
            expect(response.statusCode).toBe(403);
        })

        test("Change Email - Unknown orgId", async () => {
            let response = await ahAPI.changeUserEmail(ahAPI.COMMON_SA_TOKEN,users[0].id,new_email,TestData.nonExisingId);
            expect(response.statusCode).toBe(403);
        })

        test("Change Email - Unknown userId", async () => {
            let response = await ahAPI.changeUserEmail(ahAPI.COMMON_SA_TOKEN,TestData.nonExisingId,new_email,TestData.superOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toMatch("Benutzer nicht gefunden");
        })
    })

    describe("Users", ()=>{

        test("Get Users", async () => {
            let response = await ahAPI.getUsers(ahAPI.COMMON_SA_TOKEN, TestData.superOrgId);
            expect(response.statusCode).toBe(200);
            expect(response.body.data).toMatchSchema({$ref: "schema#/definitions/users_admin"});
        })

        test("Get Users - User Info", async () => {
            let response = await ahAPI.getUsers(ahAPI.COMMON_SA_TOKEN, TestData.superOrgId,`?search=${TestData.defaultUserDetails.email}`);
            expect(response.statusCode).toBe(200);
            let targetUser=response.body.data.find(t=>t.email==TestData.defaultUserDetails.email)
            expect(targetUser.firstName).toBe(TestData.defaultUserDetails.fname);
            expect(targetUser.lastName).toBe(TestData.defaultUserDetails.lname);
            expect(targetUser.email).toBe(TestData.defaultUserDetails.email);
            expect(targetUser.status).toBe("active");
        })

        test("Get Users - Unauthorized", async () => {
            let response = await ahAPI.getUsers("BLAH", TestData.superOrgId);
            expect(response.statusCode).toBe(401);
        })


        test("Get Users - Unprivileged", async () => {
            let response = await ahAPI.getUsers(ahAPI.COMMON_TOKEN, TestData.defaultOrgId);
            expect(response.statusCode).toBe(403);
        })

        test("Get Users - unknown orgId", async () => {
            let response = await ahAPI.getUsers(ahAPI.COMMON_SA_TOKEN, TestData.nonExisingId);
            expect(response.statusCode).toBe(403);
        })

    })

})

