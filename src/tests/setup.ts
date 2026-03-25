import commonHelper from "../api/CommonHelper";
import TestData from "./testdata";
import supertestAHAPIHelper from "../api/SupertestAHAPIHelper";
import SupertestAHAPIHelper from "../api/SupertestAHAPIHelper";
import ahAPI from "../api/SupertestAHAPIHelper";
import ahDbHelper from "../api/AHDBHelper";
const fs = require("fs");
const path = require("path")

require('ts-node/register');

const setup = async () => {

    const allureDir = path.resolve(__dirname, "allure-results");
    if (fs.existsSync(allureDir)) {
        fs.rmSync(allureDir, { recursive: true, force: true });
    }
    fs.mkdirSync(allureDir, { recursive: true });
    console.log("✔ Allure results folder cleaned");

    await supertestAHAPIHelper.getCommonSessionForSA()

    if (process.env.ENVIRONMENT.toLowerCase()!="stg" ) {

        let allPermissionsIds=[]
        for (let i=0;i<TestData.permissions.length; i++){
            allPermissionsIds.push((await ahDbHelper.get_permission_id_by_name(TestData.permissions[i])).id)
        }
        let orgIds=[TestData.defaultOrgId,TestData.superOrgId,TestData.previewPDFOrgId]
        for (let i=0; i< orgIds.length; i++){
            let allOnRole= await supertestAHAPIHelper.getOrganizationRole(TestData.defaultPermissionRoleAllOn,SupertestAHAPIHelper.COMMON_SA_TOKEN,orgIds[i]);
            if (allOnRole == undefined) {
                let payload={
                    "name": TestData.defaultPermissionRoleAllOn,
                    "description": "AT Permission All ON Role Description",
                    "permissionIds":allPermissionsIds,
                    "weight": 1
                }
                await ahAPI.post_roles(SupertestAHAPIHelper.COMMON_SA_TOKEN,payload,orgIds[i]);
            }

            let allOffRole= await supertestAHAPIHelper.getOrganizationRole(TestData.defaultPermissionRoleAllOff,SupertestAHAPIHelper.COMMON_SA_TOKEN,orgIds[i]);
            let perm_id=(await ahDbHelper.get_permission_id_by_name("contract_item:export")).id.toString()
            if (allOffRole == undefined) {
                let payload = {
                    "name": TestData.defaultPermissionRoleAllOff,
                    "description": "AT Permission All OFF Role Description",
                    "permissionIds": [perm_id],
                    "weight": 1
                }
                let resp= await ahAPI.post_roles(SupertestAHAPIHelper.COMMON_SA_TOKEN, payload, orgIds[i]);
            }

        }


        let permRole= await supertestAHAPIHelper.getOrganizationRole(TestData.defaultPermissionRole,SupertestAHAPIHelper.COMMON_SA_TOKEN,TestData.defaultOrgId);
        if (permRole == undefined) {
            let payload={
                "name": TestData.defaultPermissionRole,
                "description": "AT Permission Role Description",
                "permissionIds":[TestData.orgReadPermissionId],
                "weight": 1
            }
            await ahAPI.post_roles(SupertestAHAPIHelper.COMMON_SA_TOKEN,payload,TestData.defaultOrgId);
        }

        let superOrg=TestData.superOrgId.toString()
        let defaultOrg=TestData.defaultOrgId.toString()
        let pdfPreviewOrg=TestData.previewPDFOrgId.toString()
        await commonHelper.registerTestUser(TestData.defaultAdminDetails,
                                           new Map([[superOrg,"Super Admin"],[defaultOrg,"Owner"]]))
         await commonHelper.registerTestUser(TestData.defaultUserDetails, new Map([[defaultOrg,"Owner"]]))
         await commonHelper.registerTestUser(TestData.restrictedUserDetails, new Map([[superOrg,"Viewer"]]))
         await commonHelper.registerTestUser(TestData.restrictedAltUserDetails, new Map([[superOrg,"Viewer"]]))
         await commonHelper.registerTestUser(TestData.defaultViewerDetails, new Map([[defaultOrg,"Viewer"]]))
         await commonHelper.registerTestUser(TestData.defaultEditUserDetails, new Map([[defaultOrg,"Owner"]]))
         await commonHelper.registerTestUser(TestData.defaultOperatorDetails, new Map([[defaultOrg,"Support Operator"]]))
         await commonHelper.registerTestUser(TestData.defaultRequesterDetails, new Map([[defaultOrg,"Requester"]]))
         await commonHelper.registerTestUser(TestData.defaultApproverDetails, new Map([[defaultOrg,"Approver"]]))
         await commonHelper.registerTestUser(TestData.defaultPermissionUserDetails, new Map([[defaultOrg,TestData.defaultPermissionRole]]))
         await commonHelper.registerTestUser(TestData.allOnPermissionUserDetails, new Map([[defaultOrg,TestData.defaultPermissionRoleAllOn],
                                                                                             [superOrg,TestData.defaultPermissionRoleAllOn],
                                                                                             [pdfPreviewOrg,TestData.defaultPermissionRoleAllOn]]))
         await commonHelper.registerTestUser(TestData.allOffPermissionUserDetails, new Map([[defaultOrg,TestData.defaultPermissionRoleAllOff],
                                                                                             [superOrg,TestData.defaultPermissionRoleAllOff],
                                                                                             [pdfPreviewOrg,TestData.defaultPermissionRoleAllOff]]))
    }
};

export default setup;