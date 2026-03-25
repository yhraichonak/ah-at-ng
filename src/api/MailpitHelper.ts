import {ENV} from "../../environment";
import commonAPIHelper from "./CommonAPIHelper";
import * as allure from "allure-js-commons";
class mailpitHelper {

     MAILPIT_URL: string = ENV.MAILPIT_URL;

     async delete_messages(msgIds:string[]) {
         return await allure.step(`Mailpit: Delete messages by ids [${JSON.stringify(msgIds)}]`, async()=> {
             const payload = {"ids": JSON.stringify(msgIds)}
             return await commonAPIHelper.send("DELETE", this.MAILPIT_URL, "/api/v1/messages", null, payload)
         })
       }

     async read_messages(msgIds:string[]) {
         return await allure.step(`Mailpit: Read messages by ids [${JSON.stringify(msgIds)}]`, async()=> {
             const payload = {"ids": msgIds, "read": true}
             return await commonAPIHelper.send("PUT", this.MAILPIT_URL, "/api/v1/messages", null, payload)
         })
     }

     async search_messages(query:string) {
         return await allure.step(`Mailpit: Search messages by query [${query}]`, async()=> {
             return await commonAPIHelper.send("GET", this.MAILPIT_URL, "/api/v1/search?query=" + query, null, null)
         })
     }

    async get_message_detail(messageId:string) {
        return await allure.step(`Mailpit: Get message details by id [${messageId}]`, async()=> {
            return await commonAPIHelper.send("GET", this.MAILPIT_URL, "/api/v1/message/" + messageId, null, null)
        })
    }

    async delete_messages_with_text(query: string) {
        return await allure.step(`Mailpit: Delete messages by text [${query}]`, async()=> {
            const res = await this.search_messages(query)
            const ids = res.body.messages.map(a => a.ID);
            if (ids.length > 0) {
                return await this.delete_messages(ids)
            } else return null;
        })
    }

    async get_message_details_by_text(query: string) {
        return await allure.step(`Mailpit: Get messages by text [${query}]`, async()=> {
            const res = await this.search_messages(query)
            const ids = res.body.messages.map(a => a.ID);
            if (ids.length > 0) {
                return await this.get_message_detail(ids[0])
            } else return null;
        })
    }
}

export default new mailpitHelper();