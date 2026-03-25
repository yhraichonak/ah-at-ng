import commonAPIHelper from "./CommonAPIHelper";
import * as allure from "allure-js-commons";
import commonHelper from "./CommonHelper";
const FRESHDESK_URL = "https://testassethub.freshdesk.com/";
const FRESHDESK_API = process.env.FRESHDESK_AUTH;
const FRESHDESK_BASIC_URL = "/api/v2";
import { format } from "date-fns";
class freshDeskHelper {

     async execute_query(url:string) {
         return await allure.step(`FreshDesk: Execute FreshDesk query [${url}]`, async()=> {
             return  await commonAPIHelper
                 .send("GET", FRESHDESK_URL, url, {"Authorization": "Bearer " + FRESHDESK_API}).then((r) => {
                    return this.verify_return_code(r);
                 });
         })
       }

    async execute_put(url:string, body) {
        return await allure.step(`FreshDesk: Execute FreshDesk put [${url}]`, async()=> {
            return  await commonAPIHelper
                .send("PUT", FRESHDESK_URL, url, {"Authorization": "Bearer " + FRESHDESK_API},body).then((r) => {
                    return r;
                });
        })
    }

    async execute_delete(url:string) {
        return await allure.step(`FreshDesk: Execute FreshDesk delete item [${url}]`, async()=> {
           try {
               await commonAPIHelper.send("DELETE", FRESHDESK_URL, url, {"Authorization": "Bearer " + FRESHDESK_API})
                   .then((r) => {this.verify_return_code(r, 204);});

           }catch (e){
               let result=await commonAPIHelper.send("DELETE", FRESHDESK_URL, url, {"Authorization": "Bearer " + FRESHDESK_API})
              if (result.statusCode!=204) {
                  (result.statusCode==405)?
                   console.log(` FreshDesk ticket ${url} Already deleted.`):
                   console.log(`Error on attempt to delete FreshDesk ticket ${result.statusCode}. ${result.statusMessage}`);
               }
            }
        })
    }

    verify_return_code(r,expectedCode=200) {
        if (r.statusCode==401){throw new Error(" Make sure that FRESHDESK_AUTH env variable is properly assigned")}
        if (r.statusCode!=expectedCode)
        {
            throw new Error(`Error while querying Freshdesk ${r.text}`);
        }
        return r;
    }


    async get_tickets() {
        return (await this.execute_query(`${FRESHDESK_BASIC_URL}/tickets`)).body;
    }
    async get_ticket_details(ticket_id: string) {
        return (await this.execute_query(`${FRESHDESK_BASIC_URL}/tickets/${ticket_id}`)).body;
    }
    async delete_ticket(ticket_id: string) {
         await this.execute_delete(`${FRESHDESK_BASIC_URL}/tickets/${ticket_id}`);
    }

    async change_ticket_status(ticket_id: string, status:string) {
        const statusesMap = { "Open": 2, "Pending": 3, "Resolved": 4, "Closed":5 ,
            "Waiting on Customer": 6, "Waiting on Third Party": 7};
        await this.execute_put(`${FRESHDESK_BASIC_URL}/tickets/${ticket_id}`,{status:statusesMap[status]});
    }

    async restore_ticket(ticket_id: string) {
        await this.execute_put(`${FRESHDESK_BASIC_URL}/tickets/${ticket_id}/restore`,{});
    }

    async search_recent_ticket(query: string) {
        let todayDate=format(new Date(), "yyyy-MM-dd")
        let queryUrl=`${FRESHDESK_BASIC_URL}/search/tickets?query="${query} AND created_at: '${todayDate}'"`
        return (await this.execute_query(queryUrl)).body;
    }
    async wait_for_new_ticket(query: string, orig_items:object[], attempts=20,descritpion_regexp="") {
         console.log(`Waiting for new FD ticket on query ${query}`)
        var i: number;
        for (i = 0; i <= attempts; i += 1) {
            let orig_tikets_ids = orig_items.map(n => n["id"]);
            let tickets = (await this.search_recent_ticket(query)).results
            tickets=tickets.filter(t=>t.description.toString().match(new RegExp(descritpion_regexp,"s")));
            let ticket_ids=tickets.map(n => n.id);
            let new_items = ticket_ids.filter(n => !orig_tikets_ids.includes(n));
            if (new_items.length == 0) {
                await commonHelper.sleep(2000)
            } else {
                console.log(`New FD ticket found ${new_items[0]} after ${i*2} seconds of waiting`)
                return new_items[0]
            }
        }
        throw new Error(`No new Freshdesk tickets on query ${query} with description [${descritpion_regexp}] where detected during ${attempts*2000} milliseconds`);
    }
}

export default new freshDeskHelper();