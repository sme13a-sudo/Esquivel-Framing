import { randomUUID,randomBytes,scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';
import pg from 'pg';
const scrypt=promisify(scryptCb);
const username=process.env.EF_ADMIN_USERNAME;
const password=process.env.EF_ADMIN_PASSWORD;
const name=process.env.EF_ADMIN_NAME||'EF Administrator';
if(!process.env.DATABASE_URL||!username||!password||password.length<12){console.error('Set DATABASE_URL, EF_ADMIN_USERNAME, and EF_ADMIN_PASSWORD (12+ characters)');process.exit(1)}
const salt=randomBytes(16);
const hash=await scrypt(password,salt,64);
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:true}});
try{await pool.query('INSERT INTO ef_users(id,username,display_name,password_hash,role,active,must_change_password) VALUES($1,$2,$3,$4,$5,true,true)',[randomUUID(),username,name,salt.toString('hex')+':'+hash.toString('hex'),'admin']);console.log('Administrator created; password change required at first sign-in.')}finally{await pool.end()}
