import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const data=join(root,'data');
mkdirSync(join(data,'uploads'),{recursive:true,mode:0o700});
const path=join(data,'ef-operations.sqlite');
const db=new DatabaseSync(path);
try{db.exec('PRAGMA foreign_keys=ON;');db.exec('PRAGMA journal_mode=WAL;');db.exec(readFileSync(join(root,'schema.sqlite.sql'),'utf8'));console.log('Local EF database initialized:',path);}finally{db.close();}
