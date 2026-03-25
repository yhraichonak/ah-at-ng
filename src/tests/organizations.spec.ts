import ahAPI from "../api/SupertestAHAPIHelper";
const { matchersWithOptions } = require('jest-json-schema');
import path from "path";
import crypto from "crypto";
import axios from "axios";
import fs from "fs";
import commonHelper from "../api/CommonHelper";
import TestData from "./testdata";
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
const orgName1="at_create_org";
const orgName2="at_create_org2";


describe('[jest] Organizations', () => {

    afterEach(async () => {
        await commonHelper.deleteOrganization(orgName1);
        await commonHelper.deleteOrganization(orgName2);
        await ahAPI.clearCommonSession();
    })

    beforeEach(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        await ahAPI.getCommonSessionForSA();
    });
    beforeAll(async () => {
    })

    test("Get organizations", async () => {
        let response =await ahAPI.getOrganizations(ahAPI.COMMON_SA_TOKEN,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/organizations'})
    })

    test("Get organizations - Info", async () => {
        let testOrg=TestData.defaultOrganizationDetails;
        let response =await ahAPI.getOrganizations(ahAPI.COMMON_SA_TOKEN,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        let targetOrg=response.body.find(t=> t["name"]===testOrg["name"])
        expect(targetOrg.id).toEqual(testOrg["id"]);
        expect(targetOrg.name).toEqual(testOrg["name"]);
        expect(targetOrg.status).toEqual(testOrg["status"]);
        expect(targetOrg.emailable).toEqual(testOrg["emailable"]);
    })


    test("Get organizations - Unauthorized", async () => {
        let response =await ahAPI.getOrganizations("blah",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })



    test("Get organization details", async () => {
        let testOrg=TestData.defaultOrganizationDetails;
        let response =await ahAPI.getOrganization(ahAPI.COMMON_SA_TOKEN,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.name).toEqual(testOrg.name);
        expect(response.body.id).toEqual(testOrg.id);
        expect(response.body.status).toEqual(testOrg.status);
        expect(response.body.emailable).toEqual(testOrg.emailable);
    })

    test("Get organization details - Unauthorized", async () => {
        let response =await ahAPI.getOrganization("blah",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Get organization details - non-existing organization", async () => {
        let response =await ahAPI.getOrganization(ahAPI.COMMON_SA_TOKEN,TestData.nonExisingId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(new RegExp(`${TestData.errorMessages['ORG_NOT_EXISTS']}`));
    })

    test("Get organization details - Unprivileged", async () => {
        let TOKEN= await ahAPI.getUserToken(TestData.defaultViewerDetails);
        let response =await ahAPI.getOrganization(TOKEN,TestData.superOrgId);
        expect(response.statusCode).toBe(404);
    })

    test("Get organization roles", async () => {
        let response =await ahAPI.getOrganizationRoles(ahAPI.COMMON_SA_TOKEN,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/user_roles'})
    })

    test.each([
        { role:"Owner",description:"The owner role enables the reseller to self manage user accounts for his organisation." },
        { role:"Viewer",description:"This is the default role that only has viewing permission." },
        { role:"Approver",description:"This is the role for the users in the reseller organisation that are allowed to make a purchase." },
        { role:"Requester",description:"This is role is used for users that need quote management permission but do not have purchase auth." },
        { role:"Support Operator",description:"This is the default role for Tesedi AM / support only" },

    ])
    ("Get organization roles - $role", async ({role, description}) => {
        let response =await ahAPI.getOrganizationRoles(ahAPI.COMMON_SA_TOKEN,TestData.defaultOrgId);
        if (response.statusCode!==200){
            throw new Error(`Unable to get organization [${TestData.defaultOrgId}] role [${role}]`)
        }
        expect(response.body.find(t=>t["name"]==role)["description"]).toEqual(description);

    })

    test("Get organization roles - Non-existing org", async () => {
        let response =await ahAPI.getOrganizationRoles(ahAPI.COMMON_TOKEN,TestData.nonExisingId);
        expect(response.statusCode).toBe(403);
        // expect(response.body.message).toMatch(new RegExp(`${TestData.errorMessages['ORG_NOT_EXISTS']}`));
    })
    test("Get organization roles - Unauthorized", async () => {
        let response =await ahAPI.getOrganizationRoles("blah",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Get organization roles - Unprivileged", async () => {
        let TOKEN= await ahAPI.getUserToken(TestData.defaultViewerDetails);
        let response =await ahAPI.getOrganizationRoles(TOKEN,TestData.superOrgId);
        expect(response.statusCode).toBe(403);
    })


    test("Get organization users", async () => {
        let response =await ahAPI.getOrganizationUsers(ahAPI.COMMON_SA_TOKEN,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/users'})
    })

    test("Get organization users - View info", async () => {
        let response =await ahAPI.getOrganizationUsers(ahAPI.COMMON_SA_TOKEN,TestData.defaultOrgId);
        let user=TestData.defaultUserDetails;
        expect(response.statusCode).toBe(200);
        let target_entity=response.body.find(n=>n.email==user["email"]);
        expect(target_entity.email).toEqual(user['email']);
        expect(target_entity.firstName).toEqual(user['fname']);
        expect(target_entity.lastName).toEqual(user['lname']);
        expect(target_entity.is_active).toEqual(user['is_active']);
    })


    test.each([
        { attribute: "email", query: "@tesedi.com" },
        { attribute: "email", query: TestData.defaultUserDetails.email}
    ])
        ("Get Organization users - Search by name: '$query'", async ({attribute, query }) => {
            const response = await ahAPI.getOrganizationUsersWithParams(
                ahAPI.COMMON_SA_TOKEN, TestData.defaultOrgId, TestData.defaultOrgId,`?search=${encodeURIComponent(query)}`);
            expect(response.statusCode).toBe(200);
            expect(response.body.map(u=>u[attribute]).join(",")).toBe(response.body.filter(u=>u[attribute].includes(query)).map(u=>u[attribute]).join(","))
        })

    test("Get Organizations - Search without results", async () => {
        const response = await ahAPI.getOrganizationUsersWithParams(
            ahAPI.COMMON_SA_TOKEN, TestData.defaultOrgId, TestData.defaultOrgId,`?search=blah&limit=100`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(0);
    });

    test("Get organization users - Non-existing org", async () => {
        let response =await ahAPI.getOrganizationUsers(ahAPI.COMMON_SA_TOKEN,TestData.nonExisingId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch(new RegExp(`${TestData.errorMessages['ORG_NOT_EXISTS']}`));
    })
    test("Get organization users - Unauthorized", async () => {
        let response =await ahAPI.getOrganizationUsers("blah",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Get organization users - Unprivileged", async () => {
        let TOKEN= await ahAPI.getUserToken(TestData.defaultViewerDetails);
        let response =await ahAPI.getOrganizationUsers(TOKEN,TestData.defaultOrgId,TestData.superOrgId);
        expect(response.statusCode).toBe(403);
    })


    test("Create organization without entity", async () => {
        let response =await ahAPI.createOrganization(ahAPI.COMMON_SA_TOKEN,orgName1,[]);
        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/organization'})
    })

    test("Create organization without name", async () => {
        let response =await ahAPI.createOrganization(ahAPI.COMMON_SA_TOKEN,"",[]);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe( "[\"name: String must contain at least 1 character(s)\"]")
    })

    test("Create organization with prolonged name", async () => {
        let response =await ahAPI.createOrganization(ahAPI.COMMON_SA_TOKEN,TestData.string257,[]);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch( "name: String must contain at most 255 character")
    })

    test("Create organization with linked entity", async () => {
        let response =await ahAPI.createOrganization(ahAPI.COMMON_SA_TOKEN,orgName1,[TestData.defaultLinkEntityId]);
        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/organization'})
    })

    test("Create organization with multiple linked entities", async () => {
        let response =await ahAPI.createOrganization(ahAPI.COMMON_SA_TOKEN,orgName1,[TestData.defaultLinkEntityId, TestData.altLinkEntityId]);
        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/organization'})
    })

    test.each([
        { locale:"en" },
        { locale:"de" },
        { locale:"fr" },
        { locale:"it" },
    ])("Create organization – locale $locale", async ({locale}) => {
        const res = await ahAPI.createOrganizationByPayload(ahAPI.COMMON_SA_TOKEN,
            {"name":orgName1,"locale":locale,"entityIds":[TestData.defaultLinkEntityId]},TestData.superOrgId);
        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe(orgName1);
        expect(res.body.locale).toBe(locale);
    });

  test("Create organization – Non-existing locale", async () => {
        const res = await ahAPI.createOrganizationByPayload(ahAPI.COMMON_SA_TOKEN,
            {"name":orgName1,"locale":"WWW","entityIds":[TestData.defaultLinkEntityId]},TestData.superOrgId);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch("locale: Invalid enum value. Expected 'fr' | 'de' | 'en' | 'it', received 'WWW'");
    });

    test.each([
        { locale:null, message:"locale: Expected 'fr' | 'de' | 'en' | 'it', received null"  },
        { locale:"AAAAA", message:"locale: Invalid enum value. Expected 'fr' | 'de' | 'en' | 'it', received 'AAAAA'" },
    ])("Create organization –  Locale [$locale]", async ({locale, message}) => {
        const res = await ahAPI.createOrganizationByPayload(ahAPI.COMMON_SA_TOKEN,
            {"name":orgName1,"locale":locale,"entityIds":[TestData.defaultLinkEntityId]},TestData.superOrgId);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(message);
    });

    test.each([
        { emailable:true },
        { emailable:false },
    ])("Create organization – emailable $emailable", async ({emailable}) => {
        const res = await ahAPI.createOrganizationByPayload(ahAPI.COMMON_SA_TOKEN,
            {"name":orgName1,"locale":"de", "emailable":emailable,"entityIds":[TestData.defaultLinkEntityId]},TestData.superOrgId);
        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe(orgName1);
        expect(res.body.emailable).toBe(emailable);
    });

    test("Create organization – Emailable Invalid", async () => {
        const res = await ahAPI.createOrganizationByPayload(ahAPI.COMMON_SA_TOKEN,
            {"name":orgName1,"locale":"en","emailable":"blah","entityIds":[TestData.defaultLinkEntityId]},TestData.superOrgId);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch("emailable: Expected boolean, received string");
    });

    test.each([
        { advPerms:true },
        { advPerms:false },
    ])("Create organization – advPerms $advPerms", async ({advPerms}) => {
        const res = await ahAPI.createOrganizationByPayload(ahAPI.COMMON_SA_TOKEN,
            {"name":orgName1,"locale":"de", "advPerms":advPerms,"entityIds":[TestData.defaultLinkEntityId]},TestData.superOrgId);
        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe(orgName1);
        expect(res.body.advPerms).toBe(advPerms);
    });

    test("Create organization – advPerms Invalid", async () => {
        const res = await ahAPI.createOrganizationByPayload(ahAPI.COMMON_SA_TOKEN,
            {"name":orgName1,"locale":"en","advPerms":"blah","entityIds":[TestData.defaultLinkEntityId]},TestData.superOrgId);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch("advPerms: Expected boolean, received string");
    });

    test("Create organization with linked non existing entity", async () => {
        let response =await ahAPI.createOrganization(ahAPI.COMMON_SA_TOKEN,orgName1,["9999999999"]);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch( /.*Entity with ID 9999999999 not found.*/s)
    })


    test("Create organization - Unauthorized", async () => {
        let response =await ahAPI.createOrganization("BLAH",orgName1,[]);
        expect(response.statusCode).toBe(401);
    })

    test("Create organization - Lack of permissions", async () => {
        let viewer_token= await ahAPI.getUserToken(TestData.defaultAdminDetails);
        let response =await ahAPI.createOrganization(viewer_token,orgName1,[]);
        expect(response.statusCode).toBe(403);
    })

    test.each([
        { attrName:"name",attrValue:orgName2, descr:"Rename" },
        { attrName:"emailable",attrValue:true, descr:"Emailable=true" },
        { attrName:"emailable",attrValue:false, descr:"Emailable=false" },
        { attrName:"advPerms",attrValue:true, descr:"advPerms=true" },
        { attrName:"advPerms",attrValue:false, descr:"advPerms=false" },
        { attrName:"locale",attrValue:"en", descr:"locale=en" },
        { attrName:"locale",attrValue:"fr", descr:"locale=fr" },
        { attrName:"locale",attrValue:"it", descr:"locale=it" },
    ])
    ("Update organization - $descr", async ({descr,attrName,attrValue}) => {
        let payload={}
        payload[attrName]=attrValue
        let org_object=await commonHelper.createOrganization({"name":orgName1});
        let response =await ahAPI.updateOrganizationByPayload(
            ahAPI.COMMON_SA_TOKEN,org_object["id"], payload,TestData.superOrgId);
        expect(response.statusCode).toBe(201);
        expect(response.body[attrName]).toBe( attrValue)
    },10000)

    test("Update organization logo", async () => {
        const logo_file = path.join(__dirname, "testimage.png");
        let org_object=await commonHelper.createOrganization({"name":orgName1});
        let response =await ahAPI.setOrganizationLogo(ahAPI.COMMON_SA_TOKEN,org_object["id"], logo_file,TestData.superOrgId);
        expect(response.statusCode).toBe(201);
    })

    test("Update organization logo - Info", async () => {
        const logo_file = path.join(__dirname, "testimage.png");
        const localBuffer = fs.readFileSync(logo_file);
        const localHash = crypto.createHash("sha256").update(localBuffer).digest("hex");

        let org_object=await commonHelper.createOrganization({"name":orgName1});
        let response =await ahAPI.setOrganizationLogo(ahAPI.COMMON_SA_TOKEN,org_object["id"], logo_file,TestData.superOrgId);
        expect(response.statusCode).toBe(201);
        let org_details =await ahAPI.getOrganization(ahAPI.COMMON_SA_TOKEN,org_object["id"]);

        const logo_response = await axios.get<ArrayBuffer>(org_details.body.logoUrl, { responseType: "arraybuffer" });
        const remoteBuffer = Buffer.from(logo_response.data);
        const remoteHash = crypto.createHash("sha256").update(remoteBuffer).digest("hex");
        expect(localHash).toEqual(remoteHash)
    })

    test("Update organization logo - non-supported file", async () => {
        const logo_file = path.join(__dirname, "poFile.pdf");
        let org_object=await commonHelper.createOrganization({"name":orgName1});
        let response =await ahAPI.setOrganizationLogo(ahAPI.COMMON_SA_TOKEN,org_object["id"], logo_file,TestData.superOrgId);
        expect(response.statusCode).toBe(400);
    })

    test("Update organization logo - Unauthorized", async () => {
        const logo_file = path.join(__dirname, "poFile.pdf");
        let org_object=await commonHelper.createOrganization({"name":orgName1});
        let response =await ahAPI.setOrganizationLogo("BLAH",org_object["id"], logo_file,TestData.superOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Update organization logo - Unprivileged", async () => {
        let TOKEN=await   ahAPI.getUserToken(TestData.restrictedUserDetails);
        const logo_file = path.join(__dirname, "poFile.pdf");
        let org_object=await commonHelper.createOrganization({"name":orgName1});
        let response =await ahAPI.setOrganizationLogo(TOKEN,org_object["id"], logo_file,TestData.superOrgId);
        expect(response.statusCode).toBe(403);
    })

    test("Update organization logo - non-existing orgId", async () => {
        const logo_file = path.join(__dirname, "poFile.pdf");
        let response =await ahAPI.setOrganizationLogo(ahAPI.COMMON_SA_TOKEN,TestData.nonExisingId, logo_file,TestData.superOrgId);
        expect([400,404]).toContain(response.statusCode);
    })


    test("Delete organization logo", async () => {
        const logo_file = path.join(__dirname, "testimage.png");
        let org_object=await commonHelper.createOrganization({"name":orgName1});
        await ahAPI.setOrganizationLogo(ahAPI.COMMON_SA_TOKEN,org_object["id"], logo_file,TestData.superOrgId);
        let response =await ahAPI.deleteOrganizationLogo(ahAPI.COMMON_SA_TOKEN,org_object["id"],TestData.superOrgId);
        expect(response.statusCode).toBe(204);
        let org_details =await ahAPI.getOrganization(ahAPI.COMMON_SA_TOKEN,org_object["id"]);
        expect(org_details.body.logoUrl).toBe(null);
    })

    test("Delete organization logo without logo", async () => {
        let org_object=await commonHelper.createOrganization({"name":orgName1});
        let response =await ahAPI.deleteOrganizationLogo(ahAPI.COMMON_SA_TOKEN,org_object["id"],TestData.superOrgId);
        expect(response.statusCode).toBe(204);
    })

    test("Delete organization logo - Unauthorized", async () => {
        const logo_file = path.join(__dirname, "testimage.png");
        let org_object=await commonHelper.createOrganization({"name":orgName1});
        await ahAPI.setOrganizationLogo(ahAPI.COMMON_SA_TOKEN,org_object["id"], logo_file,TestData.superOrgId);
        let response =await ahAPI.deleteOrganizationLogo("BLAH",org_object["id"],TestData.superOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Delete organization logo - Unprivileged", async () => {
        let TOKEN=await   ahAPI.getUserToken(TestData.restrictedUserDetails);
        const logo_file = path.join(__dirname, "testimage.png");
        let org_object=await commonHelper.createOrganization({"name":orgName1});
        await ahAPI.setOrganizationLogo(ahAPI.COMMON_SA_TOKEN,org_object["id"], logo_file,TestData.superOrgId);
        let response =await ahAPI.deleteOrganizationLogo(TOKEN,org_object["id"],TestData.superOrgId);
        expect(response.statusCode).toBe(403);
    })

    test("Delete organization logo - non-existing orgId", async () => {
        const logo_file = path.join(__dirname, "testimage.png");
        let org_object=await commonHelper.createOrganization({"name":orgName1});
        await ahAPI.setOrganizationLogo(ahAPI.COMMON_SA_TOKEN,org_object["id"], logo_file,TestData.superOrgId);
        let response =await ahAPI.deleteOrganizationLogo(ahAPI.COMMON_SA_TOKEN,TestData.nonExisingId,TestData.superOrgId);
        expect(response.statusCode).toBe(404);
    })

    test.each([
        { attrName:"name",attrValue:"", descr:"Empty name", message:"name: String must contain at least 1 character(s)" },
        { attrName:"name",attrValue:TestData.string257, descr:"Prolonged name", message:"name: String must contain at most 255 character" },
        { attrName:"emailable",attrValue:null, descr:"Empty emailable", message:"emailable: Expected boolean, received null" },
        { attrName:"advPerms",attrValue:"blah", descr:"Invalid advPerms", message:"advPerms: Expected boolean, received string" },
    ])
    ("Update organization - Negative - $descr", async ({descr,attrName,attrValue,message}) => {
        let payload={}
        payload[attrName]=attrValue
        let org_object=await commonHelper.createOrganization({"name":orgName1});
        let response =await ahAPI.updateOrganizationByPayload(
            ahAPI.COMMON_SA_TOKEN,org_object["id"], payload,TestData.superOrgId);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch( message)
    })

    test("Update organization - unauthorized", async () => {
        let org_object=await commonHelper.createOrganization({"name":orgName1});
        let response =await ahAPI.updateOrganization("BLAH",org_object["id"],orgName2,false, TestData.superOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Update organization - unknown orgId", async () => {
        let response =await ahAPI.updateOrganization(ahAPI.COMMON_SA_TOKEN,TestData.nonExisingId,orgName2,false, TestData.superOrgId);
        expect(response.statusCode).toBe(404);
    })

    test("Update organization - lack permission", async () => {
        let org_object=await commonHelper.createOrganization({"name":orgName1});
        let viewer_token= await ahAPI.getUserToken(TestData.defaultViewerUser);
        let response =await ahAPI.updateOrganization(viewer_token,org_object["id"],orgName2,false, TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test.each([
        { payload: {entityIds:[TestData.defaultLinkEntityId]}, descr:"link one entity" },
        { payload: {entityIds:[TestData.defaultLinkEntityId,TestData.altLinkEntityId ]}, descr:"link multiple entities" },
    ])
    ("Link organization - $descr", async ({descr,payload}) => {
        let org_object=await commonHelper.createOrganization({"name":orgName1});
        let response =await ahAPI.linkEntitiesToOrganization(ahAPI.COMMON_SA_TOKEN,org_object["id"], payload,TestData.superOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(payload.entityIds.length);
    })

    test.each([
        { payload: {entityIds:[]}, descr:"Unlink entity" },
        { payload: {entityIds:[TestData.altLinkEntityId ]}, descr:"Change linked entities" },
    ])
    ("Link organization - Already linked - $descr", async ({descr,payload}) => {
        const res = await ahAPI.createOrganizationByPayload(ahAPI.COMMON_SA_TOKEN,
            {"name":orgName1,"locale":"en","entityIds":[TestData.defaultLinkEntityId]},TestData.superOrgId);
        let response =await ahAPI.linkEntitiesToOrganization(ahAPI.COMMON_SA_TOKEN,res.body.id, payload,TestData.superOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(payload.entityIds.length);
    })


    test.each([
        { emailable: true, entityIdsInit:[],entityIds:[TestData.defaultLinkEntityId], enabled:"active", descr: "case1" },
        { emailable: true,entityIdsInit:[], entityIds:[ ], enabled:"inactive", descr: "case2" },
        { emailable: true, entityIdsInit:[TestData.defaultLinkEntityId],entityIds:[], enabled:"inactive", descr: "case3" },
        { emailable: true,entityIdsInit:[TestData.defaultLinkEntityId], entityIds:[TestData.altLinkEntityId ], enabled:"active", descr: "case4" },
        { emailable: false, entityIdsInit:[],entityIds:[TestData.defaultLinkEntityId], enabled:"inactive", descr: "case5" },
        { emailable: false,entityIdsInit:[], entityIds:[ ], enabled:"inactive", descr: "case6" },
        { emailable: false, entityIdsInit:[TestData.defaultLinkEntityId],entityIds:[], enabled:"inactive", descr: "case7" },
        { emailable: false,entityIdsInit:[TestData.defaultLinkEntityId], entityIds:[TestData.altLinkEntityId ], enabled:"inactive", descr: "case8" },

    ])
    ("Link organization - Active status - Change linked - $descr ", async ({enabled,entityIds,emailable,descr}) => {
        const res = await ahAPI.createOrganizationByPayload(ahAPI.COMMON_SA_TOKEN,
            {"name":orgName1,"locale":"en",emailable:emailable, "entityIds":entityIds},TestData.superOrgId);
        await ahAPI.linkEntitiesToOrganization(ahAPI.COMMON_SA_TOKEN,res.body.id,
            {"entityIds":entityIds},TestData.superOrgId);
        let response=await ahAPI.getOrganization(ahAPI.COMMON_SA_TOKEN,res.body.id);
        if (response.statusCode!==200){
            throw new Error(`Unable to get organization [${res.body.id}] details`)
        }
        expect(response.body.status).toBe(enabled);
    })

    test.each([
        { emailableInit: true, emailable: false,entityIds:[], enabled:"inactive", descr: "case1" },
        { emailableInit: true, emailable: false, entityIds:[TestData.defaultLinkEntityId], enabled:"inactive", descr: "case2" },
        { emailableInit: false,emailable: true, entityIds:[], enabled:"inactive", descr: "case3" },
        { emailableInit: false,emailable: true,entityIds:[TestData.defaultLinkEntityId ], enabled:"active", descr: "case4" },
    ])
    ("Link organization - Active status -  Emailable - $descr ", async ({enabled,entityIds,emailable,descr}) => {
        const res = await ahAPI.createOrganizationByPayload(ahAPI.COMMON_SA_TOKEN,
            {"name":orgName1,"locale":"en",emailable:emailable, "entityIds":entityIds},TestData.superOrgId);
        await ahAPI.linkEntitiesToOrganization(ahAPI.COMMON_SA_TOKEN,res.body.id,
            {"entityIds":entityIds},TestData.superOrgId);
        let response=await ahAPI.getOrganization(ahAPI.COMMON_SA_TOKEN,res.body.id);
        expect(response.body.status).toBe(enabled);
    })

    test.each([
        { initialEmailable: true, emailable: false, entityIds:[TestData.defaultLinkEntityId], enabled:"inactive", descr: "case1" },
        { initialEmailable: true, emailable: false, entityIds:[ ], enabled:"inactive", descr: "case2" },
        { initialEmailable: false, emailable: true, entityIds:[TestData.defaultLinkEntityId], enabled:"active", descr: "case3" },
        { initialEmailable: false, emailable: true, entityIds:[ ], enabled:"inactive", descr: "case4" }
    ])
    ("Link organization - Active status - Change Emailable - $descr ", async ({initialEmailable, enabled,entityIds,emailable,descr}) => {
        const res = await ahAPI.createOrganizationByPayload(ahAPI.COMMON_SA_TOKEN,
            {"name":orgName1,"locale":"en",emailable:initialEmailable, "entityIds":entityIds},TestData.superOrgId);

        await ahAPI.updateOrganizationByPayload(
            ahAPI.COMMON_SA_TOKEN,res.body.id, {emailable:emailable},TestData.superOrgId);

        let response=await ahAPI.getOrganization(ahAPI.COMMON_SA_TOKEN,res.body.id);
        expect(response.body.status).toBe(enabled);
    })

    test("Link organization to entity - Unauthorized", async () => {
        let org_object= await commonHelper.recreateOrganization({"name":orgName1});
        let response =await ahAPI.linkEntitiesToOrganization("BLAH",org_object["id"],[TestData.defaultLinkEntityId], TestData.superOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Link organization to entity - Lack Permission", async () => {
        let TOKEN= await ahAPI.getUserToken(TestData.defaultViewerDetails);
        let org_object= await commonHelper.recreateOrganization({"name":orgName1});
        let response =await ahAPI.linkEntitiesToOrganization(TOKEN,org_object["id"],[TestData.defaultLinkEntityId], TestData.superOrgId);
        expect(response.statusCode).toBe(403);
    })

    test("Link organization to entity - Unknown organization", async () => {
        let response =await ahAPI.linkEntitiesToOrganization(
            ahAPI.COMMON_SA_TOKEN,TestData.nonExisingId,{entityIds:[TestData.defaultLinkEntityId]}, TestData.superOrgId);
        expect(response.statusCode).toBe(404);
    })

    test(`Delete Organization`, async () => {
        let org_object= await commonHelper.recreateOrganization({"name":orgName1});
        let response =await ahAPI.deleteOrganization(ahAPI.COMMON_SA_TOKEN,org_object["id"]);
        expect(response.statusCode).toBe(200);
    })

    test(`Delete Organization - non-exisiting`, async () => {
        let response =await ahAPI.deleteOrganization(ahAPI.COMMON_SA_TOKEN,TestData.nonExisingId);
        expect(response.statusCode).toBe(404);
    })

    test(`Delete Organization - unauthorized`, async () => {
        let org_object= await commonHelper.recreateOrganization({"name":orgName1});
        let response =await ahAPI.deleteOrganization("BLAH",org_object["id"]);
        expect(response.statusCode).toBe(401);
    })

    test(`Delete Organization - non-privileged`, async () => {
        let TOKEN= await ahAPI.getUserToken(TestData.defaultViewerDetails);
        let org_object= await commonHelper.recreateOrganization({"name":orgName1});
        let response =await ahAPI.deleteOrganization(TOKEN,org_object["id"]);
        expect(response.statusCode).toBe(403);
    })

    test(`Get Organization Entities`, async () => {
        let response =await ahAPI.getOrganizationEntities(ahAPI.COMMON_SA_TOKEN,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/entities'} );
    })

    test(`Get Organization Entities - Entity Info`, async () => {
        let response =await ahAPI.getOrganizationEntities(ahAPI.COMMON_SA_TOKEN,TestData.defaultOrgId);
        let testEntity=TestData.defaultOrganizationEntityDetails
        expect(response.statusCode).toBe(200);
        let targetOrg=response.body.find(t=> t["name"]===testEntity["name"])
        expect(targetOrg.id).toEqual(testEntity["id"]);
        expect(targetOrg.name).toEqual(testEntity["name"]);
        expect(targetOrg.isActive).toEqual(testEntity["isActive"]);
        expect(targetOrg.type).toEqual(testEntity["type"]);
    })

    test(`Get Organization Entities - Unauthorized`, async () => {
        let response =await ahAPI.getOrganizationEntities("BLAH",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test(`Get Organization Entities - Unprivileged`, async () => {
        let TOKEN= await ahAPI.getUserToken(TestData.defaultViewerDetails);
        let response =await ahAPI.getOrganizationEntities(TOKEN,TestData.defaultOrgId);
        expect(response.statusCode).toBe(403);
    })


    test(`Get Organization Entities - Invalid orgId`, async () => {
        let response =await ahAPI.getOrganizationEntities(ahAPI.COMMON_SA_TOKEN,"blah");
        expect(response.statusCode).toBe(400);
    })
})