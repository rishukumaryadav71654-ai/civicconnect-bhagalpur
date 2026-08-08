const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || "123456";
const DB_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function loadDB(){
  if(!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({complaints:{}}, null, 2));
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function saveDB(db){ fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

const sessions = new Map();

function auth(req,res,next){
  const token = (req.headers.authorization || "").replace("Bearer ","");
  if(!token || !sessions.has(token)) return res.status(401).json({error:"Unauthorized"});
  next();
}

app.post("/api/complaints",(req,res)=>{
  const {name,mobile,category,area,description}=req.body;
  if(!name || !/^\d{10}$/.test(mobile) || !category || !area || !description || description.trim().length<10)
    return res.status(400).json({error:"Invalid complaint data"});
  const db=loadDB();
  const num=Object.keys(db.complaints).length+1;
  const id="BHP-2026-"+String(num).padStart(5,"0");
  db.complaints[id]={id,name,mobile,category,area,description,status:"Submitted",created:new Date().toLocaleString("en-IN")};
  saveDB(db);
  res.json({id});
});

app.get("/api/complaints/:id",(req,res)=>{
  const c=loadDB().complaints[req.params.id.toUpperCase()];
  if(!c) return res.status(404).json({error:"Complaint not found"});
  res.json(c);
});

app.post("/api/admin/login",(req,res)=>{
  if(req.body.pin!==ADMIN_PIN) return res.status(401).json({error:"Wrong PIN"});
  const token=crypto.randomBytes(32).toString("hex");
  sessions.set(token,true);
  res.json({token});
});

app.post("/api/admin/logout",auth,(req,res)=>{
  const token=(req.headers.authorization||"").replace("Bearer ","");
  sessions.delete(token);
  res.json({ok:true});
});

app.get("/api/admin/complaints",auth,(req,res)=>{
  res.json(Object.values(loadDB().complaints).reverse());
});

app.patch("/api/admin/complaints/:id",auth,(req,res)=>{
  const allowed=["Submitted","Under Review","Assigned","In Progress","Resolved"];
  if(!allowed.includes(req.body.status)) return res.status(400).json({error:"Invalid status"});
  const db=loadDB(), id=req.params.id.toUpperCase();
  if(!db.complaints[id]) return res.status(404).json({error:"Complaint not found"});
  db.complaints[id].status=req.body.status;
  saveDB(db);
  res.json(db.complaints[id]);
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

app.listen(PORT,()=>console.log(`CivicConnect running on http://localhost:${PORT}`));
