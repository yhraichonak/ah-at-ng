import db from "./CommonDBHelper";

class AHDBHelper {
    async removeContractFromDB(contractNo:String) {
        await db.query("delete from contract_items where contract_id = '" + contractNo + "'")
        return await db.query("delete from contracts where id = '" + contractNo + "'")
    }
    async removeEntity(entityId:String) {
        await db.query("delete from entities where id = '" + entityId + "'")
    }

    async disable_ff(ffName:String) {
        let disableFFQuery=`update feature_flags set enabled=false where name='${ffName}'`;
        await db.none(disableFFQuery)
    }

    async set_ff_status(ffName:String, enabled:boolean) {
        let updateFFQuery=`update feature_flags set enabled=${enabled} where name='${ffName}'`;
        await db.none(updateFFQuery)
    }
    async get_ff(ffName:String) {
        let disableFFQuery=`select enabled from feature_flags where name='${ffName}'`;
        return await db.one(disableFFQuery)
    }
    async enable_ff(ffName:String) {
        let enableFFQuery=`update feature_flags set enabled=true where name='${ffName}'`;
        await db.none(enableFFQuery)
    }
    async set_email_queue_item_status(notification_text:string, status:string) {
        let updateQuery=`update email_queue set status='${status}' where payload::text like '%${notification_text}%'`;
        await db.none(updateQuery)
    }

    async get_email_queue_item_status(notification_text:string) {
        let result=`select status from email_queue where payload::text like '%${notification_text}%'`;
        return await db.one(result)
    }
    async update_global_notification(notification_text:string, update_query:string) {
        let updateQuery=`update global_notifications set ${update_query} where content::text like '%${notification_text}%'`;
        await db.none(updateQuery)
    }
    async enable_ff_for_org(ffName:String, orgId) {
        let orgIds=`{${orgId}}`
        let enableFFQuery=`update feature_flags set enabled=true,organization_ids='${orgIds}'  where name='${ffName}'`;
        await db.none(enableFFQuery)
    }

    async removeQuote(quoteId:String) {
        await db.query("delete from quotes where id = '" + quoteId + "'")
    }

    async undeleteRequest(requestId:String) {
        let undelete_request=`update requests set deleted_at=NULL where id='${requestId}'`;
        await db.none(undelete_request)
    }

    async removeContact(entityId:String) {
        await db.query("delete from contacts where id = '" + entityId + "'")
    }

    async removeUserByEmail(email:String) {
        await db.query("delete from user_roles where user_id in (select id from users where email = '"+email+"')")
        await db.query("delete from users where email = '" + email + "'")
        await db.query("delete from invitations where email = '" + email + "'")
    }
    async  set_quote_status(quote_num: string, status:string) {
        let update_quote_status_sql=`update quotes set ui_status='${status}' where quote_no='${quote_num}'`;
        await db.none(update_quote_status_sql)
    }

    async  set_sp_expiration(sp_id: string, end_date:string) {
        let update_sp=`update service_packs set end_date='${end_date}' where id='${sp_id}'`;
        await db.none(update_sp)
    }


    async  get_permission_id_by_name(name: string) {
       return await db.one(`select id from permissions where name = '${name}'`);
    }

    async  enable_user_by_email(email: string, enable:boolean) {
        let create_user_sql=`update users set is_active=${enable} where email='${email}'`;
        await db.none(create_user_sql)
    }
}
export default new AHDBHelper()