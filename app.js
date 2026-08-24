(()=>{"use strict";
const Q=new URLSearchParams(location.search);
const sid=(Q.get("id")||"").trim();
const group=(Q.get("group")||"").trim().toUpperCase();
const token=(Q.get("token")||"").trim();
const valid=sid&&["A","B","C"].includes(group)&&token;
const $=id=>document.getElementById(id);

let task=0,stage=0,responses=[],stageStarted=0,finalized=false;
let marks=[]; // {s, px, py, rawX, rawY}
let drawState=null;

$("studyMeta").textContent=STUDY_CONFIG.studyName;
if(STUDY_CONFIG.requireAssignedLink&&!valid){
  $("invalid").hidden=false;
}else{
  $("consent").hidden=false;
  $("showId").textContent=sid;
  $("showGroup").textContent=group;
}

function sample(poly,n=61){
  let lens=[],cum=[0],tot=0;
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length];
    const l=Math.hypot(b[0]-a[0],b[1]-a[1]);
    lens.push(l);tot+=l;cum.push(tot);
  }
  let pts=[],ss=[];
  for(let k=0;k<n;k++){
    const s=tot*k/n;let j=0;
    while(j<poly.length-1&&s>=cum[j+1])j++;
    const t=(s-cum[j])/lens[j],a=poly[j],b=poly[(j+1)%poly.length];
    pts.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);
    ss.push(k/n);
  }
  return [pts,ss];
}

function taskData(i){
  const p=STUDY_TASKS.polygons[i],r=STUDY_TASKS.refs[i],[pts,s]=sample(p),L=r[0],G=r[1];
  const dl=pts.map(q=>Math.hypot(q[0]-L[0],q[1]-L[1]));
  const dg=pts.map(q=>Math.hypot(q[0]-G[0],q[1]-G[1]));
  const d1=a=>a.slice(1).map((v,k)=>v-a[k]);
  const absdiff=a=>d1(a).map(Math.abs);
  return {s,dl,dg,d1l:d1(dl),d1g:d1(dg),cl:absdiff(d1(dl)),cg:absdiff(d1(dg))};
}

function ctx(){
  const c=$("plot"),x=c.getContext("2d");
  x.clearRect(0,0,c.width,c.height);
  x.font="17px system-ui";
  x.strokeStyle="#111";
  x.fillStyle="#111";
  return [c,x];
}

function polygonMetrics(poly){
  const lens=[],cum=[0];let total=0;
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length];
    const l=Math.hypot(b[0]-a[0],b[1]-a[1]);
    lens.push(l);total+=l;cum.push(total);
  }
  return {lens,cum,total};
}

function drawPolygon(poly){
  const[c,x]=ctx(),xs=poly.map(q=>q[0]),ys=poly.map(q=>q[1]);
  const mnx=Math.min(...xs),mxx=Math.max(...xs),mny=Math.min(...ys),mxy=Math.max(...ys);
  const X=v=>100+(v-mnx)/(mxx-mnx)*780;
  const Y=v=>380-(v-mny)/(mxy-mny)*300;
  const canvasPts=poly.map(q=>[X(q[0]),Y(q[1])]);
  x.lineWidth=4;x.beginPath();
  canvasPts.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));
  x.closePath();x.stroke();
  for(const q of canvasPts){x.beginPath();x.arc(q[0],q[1],5,0,2*Math.PI);x.fill();}
  drawState={type:"polygon",poly,canvasPts,metrics:polygonMetrics(poly)};
  drawMarkers();
}

function drawGraph(a,b,l1,l2){
  const[c,x]=ctx(),all=a.concat(b);
  const lo0=Math.min(...all),hi0=Math.max(...all),pad=Math.max((hi0-lo0)*.08,.02),lo=lo0-pad,hi=hi0+pad;
  const left=90,right=910,top=55,bottom=390;
  const X=i=>left+i/(Math.max(a.length,b.length)-1)*(right-left);
  const Y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top);

  x.lineWidth=2;x.beginPath();x.moveTo(left-15,top-10);x.lineTo(left-15,bottom);x.lineTo(right+20,bottom);x.stroke();

  for(const f of [0,.25,.5,.75,1]){
    const xx=left+f*(right-left);
    x.fillText(f.toFixed(2),xx-18,420);
  }
  function line(v,d){
    x.setLineDash(d);x.beginPath();
    v.forEach((q,i)=>i?x.lineTo(X(i),Y(q)):x.moveTo(X(i),Y(q)));
    x.stroke();
  }
  line(a,[]);line(b,[12,9]);x.setLineDash([]);
  x.fillText(l1+" (solid)",755,35);
  x.fillText(l2+" (dashed)",755,58);
  x.fillText("normalized journey position s",365,455);

  drawState={type:"graph",left,right,top,bottom};
  drawMarkers();
}

function drawMarkers(){
  if(!drawState)return;
  const c=$("plot"),x=c.getContext("2d");
  x.save();
  x.font="bold 17px system-ui";
  marks.forEach((m,i)=>{
    if(drawState.type==="graph"){
      const px=drawState.left+m.s*(drawState.right-drawState.left);
      x.strokeStyle="#1f5fbf";x.setLineDash([7,6]);x.lineWidth=2;
      x.beginPath();x.moveTo(px,drawState.top);x.lineTo(px,drawState.bottom);x.stroke();
      x.setLineDash([]);x.fillStyle="#1f5fbf";x.fillText(String(i+1),px+5,drawState.top+20);
    }else{
      x.fillStyle="#1f5fbf";x.beginPath();x.arc(m.px,m.py,9,0,2*Math.PI);x.fill();
      x.fillStyle="#fff";x.textAlign="center";x.textBaseline="middle";x.fillText(String(i+1),m.px,m.py+1);
      x.textAlign="start";x.textBaseline="alphabetic";
    }
  });
  x.restore();
  updateMarkSummary();
}

function updateMarkSummary(){
  $("markCount").textContent=marks.length;
  $("selectedS").textContent=marks.length?marks.map(m=>m.s.toFixed(3)).join(", "):"None";
}

function nearestPointOnSegment(px,py,ax,ay,bx,by){
  const vx=bx-ax,vy=by-ay,wx=px-ax,wy=py-ay;
  const den=vx*vx+vy*vy;
  let t=den?((wx*vx+wy*vy)/den):0;
  t=Math.max(0,Math.min(1,t));
  const qx=ax+t*vx,qy=ay+t*vy;
  return {t,qx,qy,d2:(px-qx)**2+(py-qy)**2};
}

function polygonClickToMark(px,py){
  const ds=drawState,cp=ds.canvasPts,pm=ds.metrics;
  let best=null;
  for(let i=0;i<cp.length;i++){
    const a=cp[i],b=cp[(i+1)%cp.length];
    const cand=nearestPointOnSegment(px,py,a[0],a[1],b[0],b[1]);
    if(!best||cand.d2<best.d2)best={...cand,edge:i};
  }
  const edge=best.edge;
  const s=(pm.cum[edge]+best.t*pm.lens[edge])/pm.total;
  return {s:(s>=1?0:s),px:best.qx,py:best.qy,rawX:px,rawY:py};
}

function graphClickToMark(px,py){
  const ds=drawState;
  if(px<ds.left||px>ds.right||py<ds.top-20||py>ds.bottom+20)return null;
  const s=Math.max(0,Math.min(1,(px-ds.left)/(ds.right-ds.left)));
  return {s,px,py,rawX:px,rawY:py};
}

function canvasCoords(evt){
  const c=$("plot"),r=c.getBoundingClientRect();
  return [(evt.clientX-r.left)*(c.width/r.width),(evt.clientY-r.top)*(c.height/r.height)];
}

$("plot").addEventListener("click",evt=>{
  if($("insufficient").checked)return;
  if(marks.length>=STUDY_CONFIG.maxMarks)return;
  const [px,py]=canvasCoords(evt);
  let mark=drawState.type==="polygon"?polygonClickToMark(px,py):graphClickToMark(px,py);
  if(!mark)return;

  // Clicking very near an existing mark removes it.
  const near=marks.findIndex(m=>Math.abs(m.s-mark.s)<0.018);
  if(near>=0){marks.splice(near,1);renderCurrentOnly();return;}

  marks.push(mark);
  marks.sort((a,b)=>a.s-b.s);
  renderCurrentOnly();
});

$("undoBtn").onclick=()=>{if(marks.length){marks.pop();renderCurrentOnly();}};
$("clearBtn").onclick=()=>{marks=[];renderCurrentOnly();};

$("insufficient").addEventListener("change",()=>{
  if($("insufficient").checked){
    marks=[];
    renderCurrentOnly();
  }
  $("plot").style.opacity=$("insufficient").checked?".55":"1";
  $("plot").style.cursor=$("insufficient").checked?"not-allowed":"crosshair";
});

function evidenceChoices(){
  if(group==="A")return[
    ["VISIBLE_CHANGE","Visible change where two straight segments meet"],
    ["OVERALL_SHAPE","Overall shape structure"],
    ["VISIBLE_JUNCTIONS","Number of visible junctions"],
    ["COMBINATION","Combination of these"],
    ["INSUFFICIENT","Insufficient evidence"]
  ];
  if(group==="B"||(group==="C"&&stage===0))return[
    ["DL_PATTERN","Change in D_L pattern"],
    ["DG_PATTERN","Change in D_G pattern"],
    ["BOTH_RAW","Changes seen in both D_L and D_G"],
    ["OVERALL_RAW","Overall pattern of the two histories"],
    ["INSUFFICIENT","Insufficient evidence"]
  ];
  if(group==="C"&&stage===1)return[
    ["DDL_PATTERN","Change in dD_L"],
    ["DDG_PATTERN","Change in dD_G"],
    ["BOTH_FIRST","Changes in both first-change traces"],
    ["COMPARE_STAGE1","Comparison with my Stage-1 answer"],
    ["INSUFFICIENT","Insufficient evidence"]
  ];
  return[
    ["CL_LOCAL","Strong localized change in C_L"],
    ["CG_LOCAL","Strong localized change in C_G"],
    ["BOTH_CHANGE","Localized changes in both C_L and C_G"],
    ["ALL_REP","Combination of all representations"],
    ["INSUFFICIENT","Insufficient evidence"]
  ];
}

function renderEvidence(){
  const box=$("evidenceOptions");
  box.innerHTML="";
  evidenceChoices().forEach(([value,label])=>{
    const el=document.createElement("label");
    el.innerHTML=`<input type="radio" name="evidence" value="${value}"> ${label}`;
    box.appendChild(el);
  });
}

function renderStageExtra(){
  const box=$("stageExtra");box.innerHTML="";
  if(group==="C"&&stage===1){
    box.innerHTML=`<fieldset><legend>Did you revise your previous inference?</legend>
      <div class="radioRow">
        <label><input type="radio" name="revised" value="Yes">Yes</label>
        <label><input type="radio" name="revised" value="No">No</label>
      </div></fieldset>`;
  }else if(group==="C"&&stage===2){
    box.innerHTML=`<fieldset><legend>Which representation was most useful?</legend>
      <div class="radioList">
        <label><input type="radio" name="mostUseful" value="Raw distances">Raw distances</label>
        <label><input type="radio" name="mostUseful" value="First changes">First changes</label>
        <label><input type="radio" name="mostUseful" value="Change-in-change">Change-in-change</label>
        <label><input type="radio" name="mostUseful" value="Combination">Combination</label>
      </div></fieldset>`;
  }
}

function setMarkInstruction(){
  $("markInstruction").textContent=
    group==="A"
      ?"Click directly on the visible boundary where you believe transitions occur. The system will snap each click to the nearest boundary position."
      :"Click anywhere in the graph at each journey position where you believe a transition occurs. Only the horizontal journey position is recorded.";
}

function render(){
  marks=[];
  $("insufficient").checked=false;
  $("plot").style.opacity="1";$("plot").style.cursor="crosshair";
  renderEvidence();renderStageExtra();setMarkInstruction();
  renderCurrentOnly();
  stageStarted=performance.now();
}

function renderCurrentOnly(){
  const d=taskData(task);
  if(group==="A"){
    $("heading").textContent=`Task A${task+1}`;
    $("instruction").textContent="Inspect the visible closed boundary. Use only the information shown in this task.";
    drawPolygon(STUDY_TASKS.polygons[task]);
  }else if(group==="B"){
    $("heading").textContent=`Task B${task+1}`;
    $("instruction").textContent="The boundary is hidden. Use only the two raw ordered distance histories.";
    drawGraph(d.dl,d.dg,"D_L","D_G");
  }else{
    const names=["Raw distance histories","First changes","Change in the changes"];
    $("heading").textContent=`Task C${task+1} — Stage ${stage+1}: ${names[stage]}`;
    $("instruction").textContent="Record your current inference before continuing. Earlier responses cannot be edited.";
    if(stage===0)drawGraph(d.dl,d.dg,"D_L","D_G");
    else if(stage===1)drawGraph(d.d1l,d.d1g,"dD_L","dD_G");
    else drawGraph(d.cl,d.cg,"C_L","C_G");
  }
  const total=group==="C"?STUDY_CONFIG.totalTasks*3:STUDY_CONFIG.totalTasks;
  const current=group==="C"?task*3+stage+1:task+1;
  $("progress").textContent=`Screen ${current} of ${total}`;
  updateMarkSummary();
}

function checked(name){
  return document.querySelector(`input[name="${name}"]:checked`)?.value||"";
}

function resetFields(){
  $("nseg").value="";
  document.querySelectorAll('input[name="confidence"],input[name="evidence"],input[name="revised"],input[name="mostUseful"]').forEach(x=>x.checked=false);
  $("status").textContent="";
  marks=[];
}

function validate(){
  const nseg=$("nseg").value.trim();
  const conf=checked("confidence");
  const ev=checked("evidence");
  const insufficient=$("insufficient").checked;

  if(!nseg||!conf||!ev){
    $("status").className="status warn";
    $("status").textContent="Please complete segment count, confidence, and the evidence choice.";
    return false;
  }
  if(!insufficient&&marks.length===0){
    $("status").className="status warn";
    $("status").textContent="Please mark at least one transition location, or select the insufficient-evidence option.";
    return false;
  }
  if(group==="C"&&stage===1&&!checked("revised")){
    $("status").className="status warn";
    $("status").textContent="Please indicate whether you revised the previous inference.";
    return false;
  }
  if(group==="C"&&stage===2&&!checked("mostUseful")){
    $("status").className="status warn";
    $("status").textContent="Please select the most useful representation.";
    return false;
  }
  return true;
}

async function send(record){
  if(!STUDY_CONFIG.submitEndpoint)return {mode:"local-only"};
  try{
    await fetch(STUDY_CONFIG.submitEndpoint,{
      method:"POST",mode:"no-cors",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify(record)
    });
    return {mode:"sent"};
  }catch(e){return {mode:"failed"};}
}

$("startBtn").onclick=()=>{
  if(!$("ready").checked)return alert("Please confirm that you are ready.");
  $("consent").hidden=true;$("study").hidden=false;render();
};

$("nextBtn").onclick=async()=>{
  if(finalized||!validate())return;
  $("nextBtn").disabled=true;

  const record={
    study_id:sid,
    group,
    token,
    task:task+1,
    stage:group==="C"?stage+1:1,
    marked_transition_count:marks.length,
    marked_s:marks.map(m=>Number(m.s.toFixed(5))).join(","),
    raw_clicks:marks.map(m=>`${Math.round(m.rawX)}:${Math.round(m.rawY)}`).join("|"),
    predicted_segments:Number($("nseg").value),
    confidence:Number(checked("confidence")),
    evidence_code:checked("evidence"),
    insufficient_evidence:$("insufficient").checked,
    revised:checked("revised"),
    most_useful:checked("mostUseful"),
    stage_duration_ms:Math.round(performance.now()-stageStarted),
    submitted_at:new Date().toISOString(),
    user_agent:navigator.userAgent
  };

  responses.push(record);
  localStorage.setItem("study_"+token,JSON.stringify(responses));
  const tx=await send(record);

  resetFields();

  if(group==="C"&&stage<2){
    stage++;render();$("nextBtn").disabled=false;return;
  }
  stage=0;task++;
  if(task<STUDY_CONFIG.totalTasks){
    render();$("nextBtn").disabled=false;return;
  }

  finalized=true;
  $("study").hidden=true;$("done").hidden=false;
  $("serverStatus").textContent=STUDY_CONFIG.submitEndpoint
    ?"Responses were submitted during the study. Keep the CSV backup until receipt is confirmed."
    :"Central submission is not configured; download the CSV backup.";
  $("nextBtn").disabled=false;
};

$("csvBtn").onclick=()=>{
  const rows=responses,keys=Object.keys(rows[0]||{});
  const esc=v=>`"${String(v??"").replaceAll('"','""')}"`;
  const csv=[keys.join(","),...rows.map(r=>keys.map(k=>esc(r[k])).join(","))].join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download=`${sid}_${group}_responses.csv`;
  a.click();
};

window.addEventListener("beforeunload",e=>{
  if(!finalized&&responses.length){e.preventDefault();e.returnValue="";}
});
})();