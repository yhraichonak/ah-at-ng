import {ENV} from "../../environment";
import commonAPIHelper from "./CommonAPIHelper";
import * as allure from "allure-js-commons";
import * as http from "node:http";
class keycloakHelper {

    AUTH_TOKEN: string;
    async authorize() {
        return await allure.step(`Keycloak: authorize`, async()=> {
            let resp = await commonAPIHelper.send("POST", ENV.KEYCLOAK_URL,
                `/realms/master/protocol/openid-connect/token`,
                null,
                "client_id=admin-cli&username=admin&password=admin&grant_type=password")
            this.AUTH_TOKEN = resp.body.access_token;
            return this.AUTH_TOKEN;
        })
    }

     async get_token() {
        if (this.AUTH_TOKEN == null) {
             return await this.authorize()
        }
        return this.AUTH_TOKEN;
    }
     async get_users(realm: string, email:string) {
         return await allure.step(`Keycloak: get users with email [${email}] from realm [${realm}]`, async()=> {
             return await commonAPIHelper.send("GET", ENV.KEYCLOAK_URL,
                 `/admin/realms/${realm}/users?email=${email}`,
                 {"Authorization": "Bearer " + await this.get_token()})
         })
    }
    async delete_user(realm: string, user_id:string) {
        return await allure.step(`Keycloak: delete users with id [${user_id}] from realm [${realm}]`, async()=> {
            return await commonAPIHelper.send("DELETE", ENV.KEYCLOAK_URL,
                `/admin/realms/${realm}/users/${user_id}`, {"Authorization": "Bearer " + await this.get_token()})
        })

    }
    async enable_user(realm: string, user_id:string) {
        return await allure.step(`Keycloak: enable users with id [${user_id}] from realm [${realm}]`, async()=> {
            let user = await commonAPIHelper.send("GET", ENV.KEYCLOAK_URL,
                `/admin/realms/${realm}/users/${user_id}`, {"Authorization": "Bearer " + await this.get_token()})
            user.body.enabled = true;
            await commonAPIHelper.send("PUT", ENV.KEYCLOAK_URL,
                `/admin/realms/${realm}/users/${user_id}`,
                {"Authorization": "Bearer " + await this.get_token()},
                user.body);
        })
    }
    async update_user_names(realm: string, user_id:string, first_name:string, last_name:string) {
        return await allure.step(`Update: users with id [${user_id}] from realm [${realm}] with names [${first_name},${ last_name}]`, async()=> {
            let user = await commonAPIHelper.send("GET", ENV.KEYCLOAK_URL,
                `/admin/realms/${realm}/users/${user_id}`, {"Authorization": "Bearer " + await this.get_token()})
            user.body.firstName = first_name;
            user.body.lastName = last_name;
            await commonAPIHelper.send("PUT", ENV.KEYCLOAK_URL,
                `/admin/realms/${realm}/users/${user_id}`,
                {"Authorization": "Bearer " + await this.get_token()},
                user.body);
        })
    }
    async delete_user_by_email(realm: string, email:string) {
        return await allure.step(`Keycloak: delete users with email [${email}] from realm [${realm}]`, async()=> {
        let user_id= await this.get_user_id(realm,email);
        return (user_id == null)?null:await this.delete_user(realm,user_id)
        })
    }
    async create_user(realm: string, payload:object) {
        return await allure.step(`Keycloak: create user [${payload}]`, async()=> {
            return await commonAPIHelper.send("POST", ENV.KEYCLOAK_URL,
                `/admin/realms/${realm}/users`,
                {"Authorization": "Bearer " + await this.get_token()},
                payload);
        })
    }
    async reset_user_password(realm: string, user_id:string, pasword:string) {
        return await allure.step(`Keycloak: reset user [${user_id}] password`, async()=> {

            return await commonAPIHelper.send("PUT", ENV.KEYCLOAK_URL,
                `/admin/realms/${realm}/users/${user_id}/reset-password`,
                {"Authorization": "Bearer " + await this.get_token()},
                {"temporary":false,"type":"password","value":pasword}).then((r) => {
            });;
        })
    }
    async create_user_with_payload(realm: string, payload: object) {
        return await allure.step(`Keycloak: create user with payload [${JSON.stringify(payload)}] from realm [${realm}]`, async()=> {
            return await commonAPIHelper.send("POST", ENV.KEYCLOAK_URL,
                `/admin/realms/${realm}/users`,
                {"Authorization": "Bearer " + await this.get_token()},
                payload);
        })
    }
    async recreate_user(realm: string,email:string, payload: object) {
        return await allure.step(`Keycloak: re-create users with email [${email}] from realm [${realm}] using payload ${JSON.stringify(payload)}`, async()=> {
            await this.delete_user_by_email(realm, email);
            await this.create_user_with_payload(realm, payload);
            return await this.get_user_id(realm, email);
        })
    }

    async get_user_id(realm: string, email:string) {
        return await allure.step(`Keycloak: get user [${email}] id from real [${realm}]`, async()=> {
            let users = await this.get_users(realm, email)
            return (users.body[0] == undefined) ? null : users.body[0].id;
        })
    }
    async get_groups(realm: string) {
        return await allure.step(`Keycloak: get user groups from [${realm}]`, async()=> {
            return await commonAPIHelper.send("GET", ENV.KEYCLOAK_URL,
                `/admin/realms/${realm}/groups`,
                {"Authorization": "Bearer " + await this.get_token()});
        })
    }

    async get_group_children(realm: string, group_id:string) {
        return await allure.step(`Keycloak: get children of group ${group_id} from realm [${realm}]`, async()=> {
            return await commonAPIHelper.send("GET", ENV.KEYCLOAK_URL,
                `/admin/realms/${realm}/groups/${group_id}/children`,
                {"Authorization": "Bearer " + await this.get_token()});
        })
    }
    async assign_user_to_group(realm: string,user_id:string ,group_id:string) {
        return await allure.step(`Keycloak: assign user [${user_id}] to group [${http}] from realm [${realm}]`, async()=> {
        return await commonAPIHelper.send("PUT", ENV.KEYCLOAK_URL,
            `/admin/realms/${realm}/users/${user_id}/groups/${group_id}`,
            {"Authorization": "Bearer "+ await this.get_token()});})
    }

    async add_user_to_group(realm: string, email:string, group: string) {
        return await allure.step(`Keycloak: add user [${email}] to group ${group} from  realm [${realm}]`, async()=> {
            let groups: String[] = group.split("/");
            let existing_groups = await this.get_groups(realm)
            let group_id = existing_groups.body.find(n => n.name == groups[0]).id;
            if (groups.length == 2) {
                let subgroups = await this.get_group_children(realm, group_id);
                group_id = subgroups.body.find(n => n.name == groups[1]).id;
            }
            let user_id = await this.get_user_id(realm, email);
            await this.assign_user_to_group(realm, user_id, group_id)
                .then((r) => {
                    expect(r.statusCode).toBe(204);
                });
            ;
        })
    }
}

export default new keycloakHelper();