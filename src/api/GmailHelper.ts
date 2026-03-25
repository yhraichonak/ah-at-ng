import commonHelper from "./CommonHelper";

const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
import { JSDOM } from 'jsdom';
class gmailHelper {
    gg_auth;

    async  loadSavedCredentialsIfExist() {
        try {
            const content = await fs.readFile(TOKEN_PATH);
            const credentials = JSON.parse(content);
            return google.auth.fromJSON(credentials);
        } catch (err) {
            return null;
        }
    }

    async  saveCredentials(client) {
        const content = await fs.readFile(CREDENTIALS_PATH);
        const keys = JSON.parse(content);
        const key = keys.installed || keys.web;
        const payload = JSON.stringify({
            type: 'authorized_user',
            client_id: key.client_id,
            client_secret: key.client_secret,
            refresh_token: client.credentials.refresh_token,
        });
        await fs.writeFile(TOKEN_PATH, payload);
    }

    async  authorize() {
        let g_auth = await this.loadSavedCredentialsIfExist();
        if (g_auth === null) {
            g_auth = await authenticate({
                scopes: SCOPES,
                keyfilePath: CREDENTIALS_PATH,
            });
            if (g_auth.credentials) {
                await this.saveCredentials(g_auth);
            }
        }
        this.gg_auth=g_auth
    }

    async  searchMessages(filter, auth= this.gg_auth) {
        let gg_client= await google.gmail({version: 'v1',  auth});
        const res = await gg_client.users.messages.list({
            userId: 'me',
            q: filter
        });
       return res.data.messages;
    }

    async  readEmails(filter) {
        let matching_mesages=await this.searchMessages(filter)
        if (matching_mesages !== undefined) {
            for (let message of matching_mesages) {
                await this.markMessageAsRead(message['id'])
            }
        }
    }


    async  waitForMessages(filter, timeout=10000,auth= this.gg_auth) {
        let gg_client= await google.gmail({version: 'v1',  auth});
        var i: number;
        for (i = 0; i < timeout; i += 2000) {
            const res = await gg_client.users.messages.list({
                userId: 'me',
                q: filter
            });
            if (res.data.messages == undefined) {
                await commonHelper.sleep(2000)
            } else {
                return res.data.messages
            }
        }
        throw new Error(`No new emails query ${filter} where detected during ${timeout} milliseconds`);
    }

    async  waitForNewMessage(filter, timeout=10000) {
       let matching_messages=await this.waitForMessages(filter,timeout)
       let messageDetails= await this.getMessageById( matching_messages[0]["id"])
        return messageDetails;
    }

    async  markMessageAsRead( messageId,auth= this.gg_auth) {
        let gg_client= await google.gmail({version: 'v1',  auth});
        const res = await gg_client.users.messages.modify({
            userId: 'me',
            id: messageId,
            'resource': {
                'addLabelIds':[],
                'removeLabelIds': ['UNREAD']
            }
        });
        return res.data;
    }
    async  getMessageById(messageId,auth= this.gg_auth) {
        let gg_client= await google.gmail({version: 'v1',  auth});
        const res = await gg_client.users.messages.get({
            userId: 'me',
            format:'full',
            id: messageId
        });
        return res.data
    }
     getPlainHTMLFromMessage(msg: any,partIndex=1):Document {

        const payload = msg.payload;
        let htmlEmail=new JSDOM(this.decodeBase64Url(payload.parts[partIndex].body.data)).window.document;
        return htmlEmail;
    }
     decodeBase64Url(data: string): string {
        const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = Buffer.from(base64, 'base64').toString('utf-8');
        return decoded;
    }
}

export default new gmailHelper();