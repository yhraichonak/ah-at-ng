import ahAPI from "../api/SupertestAHAPIHelper";
import dbHelper from "./CommonDBHelper";
import commonAPIHelper from "../api/CommonAPIHelper";
import TestData from "../tests/testdata";
import * as allure from "allure-js-commons";
import {writeFileSync} from "fs";
import keycloakHelper from "./KeycloakHelper";
import supertestAHAPIHelper from "../api/SupertestAHAPIHelper";

class commonHelper {

    async deleteOrganization(orgName:string) {
        const sa_token = (await ahAPI.getUserToken(TestData.saUserDetails));
        let orgDetails= (await ahAPI.getOrganizationByName(sa_token,orgName));
        if (orgDetails!==undefined) {
            await ahAPI.deleteOrganization(sa_token, orgDetails.id)
        }
    }

    async recreateOrganization(org:object) {
        await this.deleteOrganization(org['name'])
       return await this.createOrganization(org);
    }

    async createOrganization(org:object) {
        return await allure.step(`API: Create test organization`, async()=> {
            const sa_token = (await ahAPI.getUserToken(TestData.saUserDetails));
            let existing_org=(await ahAPI.getOrganizationByName(sa_token,org['name']));
            if (existing_org === undefined) {
                let response=await ahAPI.createOrganization(sa_token,org['name'],org['entityId'])
                return response.body;
            }else{
                return existing_org;
            }
        })
    }

    async registerTestUser(user:object, orgRoles) {
        let user_db_id=user['id']
        if (user_db_id === '') {
            let userObject = structuredClone(TestData.keycloakUserPayload)
            userObject.firstName=user["fname"]
            userObject.lastName=user["lname"]
            userObject.email = user['email']
            const admin_token = (await ahAPI.getUserToken(TestData.saUserDetails));
            for (var orgRole of orgRoles) {
                let orgid=orgRole[0]
                let existing_user = (await ahAPI.getOrganizationUser(orgid,userObject.email));
                if (existing_user === undefined) {
                    await keycloakHelper.create_user(TestData.defaultRealm, userObject);
                    let keycloak_user_id = (await keycloakHelper.get_users(TestData.defaultRealm, userObject.email)).body[0].id;
                    await keycloakHelper.reset_user_password(TestData.defaultRealm, keycloak_user_id, user["pass"])
                    console.log(`Keycloak user created with id ${keycloak_user_id}`)
                    let sqlQuery = `insert into users (id, keycloak_id, email, first_name, last_name, phone,
                                                       status,
                                                       created_at, updated_at, last_login_at)
                                    values (gen_random_uuid(), '${keycloak_user_id}', '${userObject.email}',
                                            '${userObject.firstName}', '${userObject.lastName}', null,
                                            ${userObject.status}, '${TestData.defaultSQLDate}',
                                            '${TestData.defaultSQLDate}', '${TestData.defaultSQLDate}');`
                    try {
                        await dbHelper.any(sqlQuery)
                    } catch (e) {
                        if (!e.message.includes("duplicate key")) {
                            console.error(`SQL-Error while inserting user id ${keycloak_user_id}: ${e}`)
                        }

                    }
                    user_db_id = (await dbHelper.one(`select id
                                                      from users
                                                      where email = '${userObject.email}'`)).id
                    let user_role_id = (await supertestAHAPIHelper.getOrganizationRoles(admin_token, orgid))
                                        .body.find(a => a["name"] === orgRoles.get(orgid)).id
                    sqlQuery = `insert into user_roles (id, user_id, role_id, created_at)
                                values (gen_random_uuid(), '${user_db_id}', '${user_role_id}',
                                        '${TestData.defaultSQLDate}');`
                    await dbHelper.any(sqlQuery)
                } else {
                    console.info(`User ${user['email']} is already registered}`)
                    user_db_id=existing_user.id
                }
                user['id'] = user_db_id
            }
            return user;
        }
    }

    async verifySorting(origOrder: string [],attr:string, order:string,useCollator=true){
        let expectedOrderString;
        if (attr.includes("Price")||attr.includes("quantity")){
            expectedOrderString=(order === "asc") ? origOrder.sort((a, b)=>(+a)-(+b)).join(",") : origOrder.sort((a, b)=>(+a)-(+b)).reverse().join(",");
        } else if (attr.includes("Status")){
            function statusSort(a: string, b: string): number {
                const statusOrder = { "Lost": 1, "Ordered": 2, "Change Requested": 3, "Open":4 ,
                                      "Active": 4, "Terminated": 3, "Expired": 2, "Renewed":1};
                if (statusOrder[a] < statusOrder[b]) return 1;
                if (statusOrder[a] > statusOrder[b]) return -1;
                return 0;
            }
            expectedOrderString=(order === "asc") ? origOrder.sort(statusSort).join(",") : origOrder.sort(statusSort).reverse().join(",");
        }   else {
            if (useCollator) {
                expectedOrderString = (order === "asc") ?
                    origOrder.sort(new Intl.Collator('en',{ sensitivity: 'case'}).compare).join(",") :
                    origOrder.sort(new Intl.Collator('en',{ sensitivity: 'case'}).compare).reverse().join(",");
            }else{
                expectedOrderString = (order === "asc") ?
                    origOrder.sort().join(",") :
                    origOrder.sort().reverse().join(",");
            }
            if (expectedOrderString.indexOf(",,")>0){
               let ind=expectedOrderString.indexOf(",,")
                //Move empty values (if any) from the end to the beginning
                expectedOrderString=`${expectedOrderString.substring(ind)}${expectedOrderString.substring(0,ind)}`
            }
        }
        return expectedOrderString
    }
    async convertBinaryXlsxToCsv(xlsx_buffer:any) {
        var rows = [];
        for(var i = 0; i < xlsx_buffer.length; i++)
        {
            var sheet = xlsx_buffer[i];
            for(var j = 0; j < sheet['data'].length; j++)
            {rows.push(sheet['data'][j]);}
        }
        return rows.join("\n");
    }

    async downloadFile(file_url:string, downloaded_file:string) {
        return await allure.step(`Download file ${file_url}`, async()=> {
           let response= await commonAPIHelper.send("GET", file_url,"",{});
           if (response.headers["content-type"].includes("text")){
               writeFileSync(downloaded_file, response.text, {flag: "w"})
           }
           else {
               writeFileSync(downloaded_file, Buffer.from(response.body, 'base64'), {flag: "w"})
           }
        })
    }
    async createAsset(asset:object) {
        return await allure.step(`API: Create asset [${JSON.stringify(asset)}]`, async()=> {
            await this.clearAssetFromDB(asset['name']);
            return (await ahAPI.sendDevAsset(ahAPI.COMMON_TOKEN, TestData.defaultOrgId, asset)).body
        })
    }

     async clearQuoteFromDB(quoteId:string) {
         return await allure.step(`API: Clear quote [${quoteId}] from DB`, async()=> {
             return await dbHelper.query("delete from quotes where quote_no = '" + quoteId + "'")
         })
    }
    async clearAssetFromDB(assetName:string) {
        return await allure.step(`API: Clear asset [${assetName}] from DB`, async()=> {
            return await dbHelper.query("delete from assets where name = '" + assetName + "'")
        })
    }
    async sleep(ms) {
        return allure.step(`Wait for [${ms}] ms `, async()=> {
            return new Promise(resolve => setTimeout(resolve, ms));
        })
    }
}

export default new commonHelper();
