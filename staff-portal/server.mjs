import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import { randomBytes, createHash, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import pg from 'pg';
const scrypt=promisify(scryptCb);
const db=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:true}});
const port=Number(process.env.PORT||3001);
const host=process.env.HOST||'127.0.0.1';
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL required');
async function hashPassword(p){const salt=randomBytes(16);const hash=await scrypt(p,salt,64);return salt.toString('hex')+':'+hash.toString('hex');}
async function verifyPassword(p,stored){const [salt,hex]=stored.split(':');if(!salt||!hex)return false;const candidate=await scrypt(p,Buffer.from(salt,'hex'),64);const expected=Buffer.from(hex,'hex');return candidate.length===expected.length&&timingSafeEqual(candidate,expected);}
const sha=x=>createHash('sha256').update(x).digest('hex');
function respond(res,status,data,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(data));}
function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(x=>{const i=x.indexOf('=');return [x.slice(0,i).trim(),x.slice(i+1).trim()]}));}
async function currentUser(req){const token=cookies(req).ef_session;if(!token)return null;const {rows}=await db.query('SELECT u.id,u.username,u.display_name,u.role,u.must_change_password FROM ef_sessions s JOIN ef_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true',[sha(token)]);return rows[0]||null;}
async function body(req){let s='';for await(const chunk of req){s+=chunk;if(s.length>8192)throw Error('Request too large')}return JSON.parse(s||'{}');}
const page=`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EF Staff Login</title><style>body{font:16px system-ui;background:#111;color:#f5f5f5;min-height:100vh;display:grid;place-items:center}main{width:min(90vw,380px);padding:32px;background:#1e1e1e;border:1px solid #a78b43}h1{letter-spacing:.1em}input,button{box-sizing:border-box;width:100%;padding:14px;margin:9px 0}button{background:#c5a65a;color:#111;border:0;font-weight:800;cursor:pointer}p{color:#d6c28d}</style><main><h1>ESQUIVEL FRAMING</h1><p>SECURE STAFF ACCESS</p><form id="login"><input name="username" placeholder="Username" autocomplete="username" required><input name="password" type="password" placeholder="Password" autocomplete="current-password" required><button>Sign in</button></form><p id="message" role="status"></p></main><script>document.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(f))});document.getElementById('message').textContent=r.ok?'Signed in. Your dashboard is being prepared.':'Unable to sign in';if(r.ok)location.href='/dashboard';};</script></html>`;
const attempts=new Map();
function loginAllowed(ip){const now=Date.now();const item=attempts.get(ip);if(!item||now-item.start>15*60_000){attempts.set(ip,{start:now,count:1});return true}item.count++;return item.count<=10}
const server=http.createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;
if(req.method==='GET'&&path==='/dashboard'){
 const user=await currentUser(req);
 if(!user){res.writeHead(302,{Location:'/login','Cache-Control':'no-store'});return res.end()}
 const html=readFileSync(fileURLToPath(new URL('./dashboard.html',import.meta.url)),'utf8');
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'"});
 return res.end(html);
}
if(req.method==='POST' && (!req.headers.origin || new URL(req.headers.origin).host !== req.headers.host)) return respond(res,403,{error:'Origin mismatch'});
if(req.method==='GET'&&path==='/login'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; form-action 'self'"});return res.end(page)}
if(req.method==='POST'&&path==='/api/login'){const ip=req.socket.remoteAddress||'unknown';if(!loginAllowed(ip))return respond(res,429,{error:'Too many login attempts. Try later.'});const {username,password}=await body(req);if(typeof username!=='string'||typeof password!=='string'||username.length>100||password.length>1024)return respond(res,400,{error:'Invalid request'});const {rows}=await db.query('SELECT * FROM ef_users WHERE username=$1 AND active=true',[username]);const user=rows[0];const valid=user&&await verifyPassword(password,user.password_hash);if(!valid)return respond(res,401,{error:'Invalid credentials'});const token=randomBytes(32).toString('hex');await db.query("INSERT INTO ef_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '12 hours')",[sha(token),user.id]);return respond(res,200,{ok:true}, {'Set-Cookie':`ef_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=43200`})}
if(req.method==='POST'&&path==='/api/change-password'){
 const user=await currentUser(req);if(!user)return respond(res,401,{error:'Sign in required'});
 const {currentPassword,newPassword}=await body(req);
 if(typeof currentPassword!=='string'||typeof newPassword!=='string'||newPassword.length<12||newPassword.length>128)return respond(res,400,{error:'New password must be 12-128 characters'});
 const result=await db.query('SELECT password_hash FROM ef_users WHERE id=$1',[user.id]);
 if(!await verifyPassword(currentPassword,result.rows[0].password_hash))return respond(res,401,{error:'Incorrect current password'});
 await db.query('UPDATE ef_users SET password_hash=$1,must_change_password=false WHERE id=$2',[await hashPassword(newPassword),user.id]);
 await db.query('DELETE FROM ef_sessions WHERE user_id=$1',[user.id]);
 return respond(res,200,{ok:true,message:'Password changed. Sign in again.'},{'Set-Cookie':'ef_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'});
}
if(req.method==='POST'&&path==='/api/admin/users'){
 const admin=await currentUser(req);if(!admin)return respond(res,401,{error:'Sign in required'});
 if(admin.role!=='admin'||admin.must_change_password)return respond(res,403,{error:'Administrator access required'});
 const {username,displayName,temporaryPassword}=await body(req);
 if(typeof username!=='string'||!/^[a-z0-9._-]{3,40}$/.test(username)||typeof displayName!=='string'||displayName.trim().length<2||displayName.length>100||typeof temporaryPassword!=='string'||temporaryPassword.length<12||temporaryPassword.length>128)return respond(res,400,{error:'Valid username, name, and temporary password (12+ characters) required'});
 try{
 const {randomUUID}=await import('node:crypto');
 const id=randomUUID();
 await db.query('INSERT INTO ef_users(id,username,display_name,password_hash,role,active,must_change_password) VALUES($1,$2,$3,$4,$5,true,true)',[id,username,displayName.trim(),await hashPassword(temporaryPassword),'staff']);
 return respond(res,201,{ok:true,id});
 }catch(e){if(e.code==='23505')return respond(res,409,{error:'Username already exists'});throw e}
}
if(req.method==='GET'&&path==='/api/admin/users'){
 const user=await currentUser(req);if(!user)return respond(res,401,{error:'Sign in required'});
 if(user.must_change_password||user.role!=='admin')return respond(res,403,{error:'Administrator access required'});
 const {rows}=await db.query('SELECT id,username,display_name,role,active,must_change_password FROM ef_users ORDER BY display_name');
 return respond(res,200,{users:rows});
}
if(req.method==='POST'&&path==='/api/admin/assign'){
 const user=await currentUser(req);if(!user)return respond(res,401,{error:'Sign in required'});
 if(user.must_change_password||user.role!=='admin')return respond(res,403,{error:'Administrator access required'});
 const {userId,projectId,assign}=await body(req);
 if(typeof userId!=='string'||typeof projectId!=='string'||typeof assign!=='boolean'||!/^[-0-9a-f]{36}$/i.test(userId)||!/^[-0-9a-f]{36}$/i.test(projectId))return respond(res,400,{error:'Invalid assignment'});
 if(assign){const result=await db.query('INSERT INTO ef_project_members(project_id,user_id) SELECT p.id,u.id FROM ef_projects p CROSS JOIN ef_users u WHERE p.id=$1 AND u.id=$2 AND u.active=true ON CONFLICT DO NOTHING',[projectId,userId]);if(!result.rowCount)return respond(res,404,{error:'Project or active user not found, or already assigned'})}
 else await db.query('DELETE FROM ef_project_members WHERE project_id=$1 AND user_id=$2',[projectId,userId]);
 return respond(res,200,{ok:true});
}
if(req.method==='GET'&&path==='/staff'){const user=await currentUser(req);if(!user)return respond(res,401,{error:'Sign in required'});if(user.must_change_password)return respond(res,403,{error:'Password change required before staff access'});const projects=await db.query(user.role==='admin'?'SELECT id,name,address,status FROM ef_projects ORDER BY name':'SELECT p.id,p.name,p.address,p.status FROM ef_projects p JOIN ef_project_members m ON m.project_id=p.id WHERE m.user_id=$1 ORDER BY p.name',user.role==='admin'?[]:[user.id]);return respond(res,200,{user:{username:user.username,display_name:user.display_name,role:user.role},projects:projects.rows})}
if(req.method==='POST'&&path==='/api/logout'){const token=cookies(req).ef_session;if(token)await db.query('DELETE FROM ef_sessions WHERE token_hash=$1',[sha(token)]);return respond(res,200,{ok:true},{'Set-Cookie':'ef_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'})}
return respond(res,404,{error:'Not found'});
}catch(e){console.error(e);respond(res,500,{error:'Server error'})}});
server.listen(port,host,()=>console.log('EF staff server listening on',host+':'+port));
export {hashPassword};
