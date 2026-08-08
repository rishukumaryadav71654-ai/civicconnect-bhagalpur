let adminToken = sessionStorage.getItem("adminToken") || "";

const $ = id => document.getElementById(id);
$("mobile").addEventListener("input", e => e.target.value = e.target.value.replace(/\D/g,"").slice(0,10));

function showErrors(){ ["nameE","mobileE","categoryE","areaE","descriptionE"].forEach(x=>$(x).textContent=""); }
$("form").addEventListener("submit", async e => {
  e.preventDefault(); showErrors(); let ok=true;
  const name=$("name").value.trim(), mobile=$("mobile").value.trim(), category=$("category").value, area=$("area").value.trim(), description=$("description").value.trim();
  if(name.length<2){$("nameE").textContent="नाम दर्ज करें";ok=false}
  if(!/^\d{10}$/.test(mobile)){$("mobileE").textContent="मोबाइल नंबर ठीक 10 अंकों का होना चाहिए";ok=false}
  if(!category){$("categoryE").textContent="श्रेणी चुनें";ok=false}
  if(area.length<2){$("areaE").textContent="क्षेत्र दर्ज करें";ok=false}
  if(description.length<10){$("descriptionE").textContent="कम से कम 10 अक्षरों का विवरण दें";ok=false}
  if(!ok)return;
  try{
    const r=await fetch("/api/complaints",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,mobile,category,area,description})});
    const data=await r.json(); if(!r.ok) throw new Error(data.error||"Submit failed");
    $("success").innerHTML=`✅ शिकायत दर्ज हुई। आपकी Complaint ID: <b>${data.id}</b>`;
    $("form").reset();
  }catch(err){$("success").innerHTML=`<div class="bad">Server error: ${err.message}</div>`}
});

async function track(){
  const id=$("trackId").value.trim().toUpperCase();
  if(!id){$("result").innerHTML='<div class="bad">Complaint ID डालें।</div>';return}
  try{
    const r=await fetch("/api/complaints/"+encodeURIComponent(id)); const c=await r.json();
    if(!r.ok) throw new Error(c.error||"Not found");
    const steps=[["✓","शिकायत दर्ज",c.created,"Submitted"],["2","जाँच की जा रही है","", "Under Review"],["3","अधिकारी को सौंपी गई","", "Assigned"],["4","कार्य प्रगति पर","", "In Progress"],["5","समस्या का समाधान","", "Resolved"]];
    const idx=Math.max(0,steps.findIndex(s=>s[3]===c.status));
    $("result").innerHTML=`<div class="tracking"><div class="trackhead"><div><small>COMPLAINT</small><h3>${c.id}</h3></div><b class="badge">${c.status}</b></div>
    <div class="summary"><div><small>श्रेणी</small><b>${c.category}</b></div><div><small>क्षेत्र</small><b>${c.area}</b></div><div><small>दर्ज</small><b>${c.created}</b></div></div>
    <div class="timeline">${steps.map((s,i)=>`<div class="${i<=idx?"active":""}"><span>${i<=idx?"✓":s[0]}</span><section><b>${s[1]}</b><small>${i<idx?"Completed":i===idx?"Current status":"Pending"}</small></section></div>`).join("")}</div></div>`;
  }catch(err){$("result").innerHTML=`<div class="bad">Complaint ID नहीं मिली।</div>`}
}

async function adminLogin(){
  const pin=$("adminPin").value;
  try{
    const r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pin})});
    const data=await r.json(); if(!r.ok) throw new Error(data.error||"Login failed");
    adminToken=data.token; sessionStorage.setItem("adminToken",adminToken);
    $("adminLogin").classList.add("hidden"); $("adminPanel").classList.remove("hidden"); $("adminMsg").textContent=""; renderAdmin();
  }catch(err){$("adminMsg").innerHTML='<div class="bad">गलत Admin PIN या server error.</div>'}
}

async function adminLogout(){
  if(adminToken) await fetch("/api/admin/logout",{method:"POST",headers:{"Authorization":"Bearer "+adminToken}}).catch(()=>{});
  adminToken=""; sessionStorage.removeItem("adminToken");
  $("adminPanel").classList.add("hidden"); $("adminLogin").classList.remove("hidden"); $("adminPin").value="";
  $("adminMsg").innerHTML='<div class="ok">Admin logout successful.</div>';
}

async function renderAdmin(){
  if(!adminToken)return;
  const r=await fetch("/api/admin/complaints",{headers:{"Authorization":"Bearer "+adminToken}});
  if(r.status===401){adminLogout();return}
  const data=await r.json(); $("count").textContent=`${data.length} complaint${data.length===1?"":"s"}`;
  const opts=[["Submitted","शिकायत दर्ज"],["Under Review","जाँच में"],["Assigned","अधिकारी को सौंपी गई"],["In Progress","कार्य प्रगति पर"],["Resolved","समाधान"]];
  $("adminList").innerHTML=data.length?data.map(c=>`<div class="admin-row"><div><b>${c.id}</b><span>${c.category} · ${c.area}</span><small>${c.created}</small></div><select onchange="changeStatus('${c.id}',this.value)">${opts.map(o=>`<option value="${o[0]}" ${c.status===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select></div>`).join(""):'<div class="empty">अभी कोई complaint नहीं है।</div>';
}
async function changeStatus(id,status){
  const r=await fetch("/api/admin/complaints/"+encodeURIComponent(id),{method:"PATCH",headers:{"Content-Type":"application/json","Authorization":"Bearer "+adminToken},body:JSON.stringify({status})});
  if(r.ok) renderAdmin(); else alert("Status update failed");
}
