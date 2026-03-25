import {ENV} from "../../environment";
import pgPromise from 'pg-promise';
const pgp = pgPromise({/* Initialization Options */});
const db = pgp(ENV.DB_URL);
export default db;