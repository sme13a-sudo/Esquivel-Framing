import pg from 'pg';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL required');
const db=new pg.Client({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:true}});
await db.connect();
try{await db.query('BEGIN');await db.query(readFileSync(fileURLToPath(new URL('./schema.sql',import.meta.url)),'utf8'));await db.query('COMMIT');console.log('EF database tables initialized')}catch(e){await db.query('ROLLBACK');throw e}finally{await db.end()}
