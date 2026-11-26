"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
type Row = {id:string; title:string; description?:string; price?:string; category?:string; body?:string; is_active?:boolean; is_published?:boolean; is_approved?:boolean; sort_order?:number; created_at?:string};
export default function Admin(){
 const [session,setSession]=useState<any>(null),[tab,setTab]=useState("services"),[rows,setRows]=useState<Row[]>([]),[message,setMessage]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [draft,setDraft]=useState({title:"",description:"",price:"",category:"서든어택",body:""});
 const [kakao,setKakao]=useState("");
 const [recovery,setRecovery]=useState(false);
 const [newPassword,setNewPassword]=useState("");
 useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>setSession(data.session));const {data}=supabase.auth.onAuthStateChange((event,s)=>{
 setSession(s);
 if(event==="PASSWORD_RECOVERY")setRecovery(true);
});return()=>data.subscription.unsubscribe();},[]);
 async function load(t=tab){if(!supabase)return;const table=t==="services"?"services":t==="notices"?"notices":t==="events"?"events":"reviews";const {data,error}=await supabase.from(table).select("*").order("created_at",{ascending:false});if(error)setMessage(error.message);else setRows((data||[]) as Row[]);}
 useEffect(()=>{if(session)load(tab);},[session,tab]);
  async function sendRecovery(){
  if(!supabase)return;
  if(!email){setMessage("이메일을 먼저 입력하세요.");return;}
  const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+"/admin"});
  setMessage(error?"이메일 발송 실패: "+error.message:"비밀번호 재설정 이메일을 보냈습니다. 메일을 확인하세요.");
 }

 async function updatePassword(){
  if(!supabase)return;
  if(newPassword.length<8){setMessage("비밀번호는 8자 이상 입력하세요.");return;}
  const {error}=await supabase.auth.updateUser({password:newPassword});
  if(error)setMessage("비밀번호 변경 실패: "+error.message);
  else{setMessage("비밀번호가 변경되었습니다.");setRecovery(false);setNewPassword("");}
 }
 async function login(e:React.FormEvent){e.preventDefault();if(!supabase)return;const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)setMessage("로그인 실패: 아이디(이메일)와 비밀번호를 확인하세요.");else{setSession(data.session);setMessage("로그인되었습니다.");}}
 async function save(e:React.FormEvent){e.preventDefault();if(!supabase)return;let table=tab==="services"?"services":tab==="notices"?"notices":tab==="events"?"events":"reviews";let payload:any=tab==="services"?{title:draft.title,description:draft.description,price:draft.price,category:draft.category,is_active:true,sort_order:0}:tab==="reviews"?{title:draft.title,body:draft.body,is_approved:false}:{title:draft.title,body:draft.body,is_published:true};const {error}=await supabase.from(table).insert(payload);if(error)setMessage("저장 실패: "+error.message);else{setMessage("등록되었습니다.");setDraft({title:"",description:"",price:"",category:"서든어택",body:""});load();}}
 async function remove(id:string){if(!supabase||!confirm("정말 삭제할까요?"))return;const table=tab==="services"?"services":tab==="notices"?"notices":tab==="events"?"events":"reviews";const {error}=await supabase.from(table).delete().eq("id",id);setMessage(error?.message||"삭제했습니다.");load();}
 async function toggle(row:Row){if(!supabase)return;const table=tab==="services"?"services":tab==="reviews"?"reviews":tab==="events"?"events":"notices";const key=tab==="services"?"is_active":tab==="reviews"?"is_approved":"is_published";const {error}=await supabase.from(table).update({[key]:!row[key as keyof Row]}).eq("id",row.id);setMessage(error?.message||"상태를 변경했습니다.");load();}
 async function loadKakao(){if(!supabase)return;const {data}=await supabase.from("site_settings").select("value").eq("key","kakao_url").maybeSingle();setKakao(data?.value||"");}
 async function saveKakao(){if(!supabase)return;const {error}=await supabase.from("site_settings").upsert({key:"kakao_url",value:kakao});setMessage(error?.message||"카카오톡 링크를 저장했습니다.");}
 if(!supabase)return <main className="adminShell"><div className="adminBox"><h1>SA RIPPER ADMIN</h1><p>.env.local에 Supabase 설정을 먼저 입력하세요.</p><a href="/">← 홈페이지</a></div></main>;
 if(recovery)return <main className="adminShell"><form className="adminBox" onSubmit={e=>{e.preventDefault();updatePassword();}}><h1>새 비밀번호 설정</h1><label>새 비밀번호<input type="password" required minLength={8} value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="8자 이상 입력하세요"/></label><button className="btn">비밀번호 변경</button>{message&&<p>{message}</p>}</form></main>;

if(!session)return <main className="adminShell"><form className="adminBox" onSubmit={login}><a className="logo" href="/">SA <b>RIPPER</b></a><h1>관리자 로그인</h1><p>등록된 관리자 계정으로 로그인하세요.</p><label>아이디 (이메일)<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>비밀번호<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn">로그인</button><button type="button" onClick={sendRecovery}>비밀번호 재설정 이메일 받기</button>{message&&<p>{message}</p>}<a href="/">← 홈페이지로 돌아가기</a></form></main>;
return <main className="adminShell"><div className="adminLayout"><aside className="adminSide"><a className="logo" href="/">SA <b>RIPPER</b></a><p>ADMIN PANEL</p>{[["services","상품 관리 / 가격"],["points","포인트 관리"],,["notices","공지사항"],["events","이벤트"],["reviews","후기 승인"],["applications","신청 / 문의"]].map(([k,v])=><button key={k} className={tab===k?"selected":""} onClick={()=>{setTab(k);setMessage("");}}>{v}</button>)}<button onClick={()=>supabase?.auth.signOut()}>로그아웃</button><a href="/">홈페이지 보기 ↗</a></aside><section className="adminMain"><div className="adminTop"><div><small>SA RIPPER MANAGEMENT</small><h1>관리자 대시보드</h1></div><span>로그인됨</span></div>{message&&<p className="adminMessage">{message}</p>}
 {tab==="points"?<Purchases/>:tab==="applications"?<Applications/>:tab==="settings"?null:<><form className="adminForm" onSubmit={save}><h2>{tab==="services"?"상품 등록":tab==="notices"?"공지 작성":tab==="events"?"이벤트 등록":"후기 등록"}</h2><label>제목<input required value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>{tab==="services"?<><label>카테고리<input value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}/></label><label>가격 표시<input value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})} placeholder="예: 상담 후 안내"/></label><label>설명<textarea value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label></>:<label>내용<textarea value={draft.body} onChange={e=>setDraft({...draft,body:e.target.value})}/></label>}<button className="btn">등록하기</button></form><h2>등록된 항목</h2><div className="adminRows">{rows.map(r=><article key={r.id}><div><b>{r.title}</b><p>{r.description||r.body||r.price}</p></div><div className="rowActions"><button onClick={()=>toggle(r)}>{tab==="services"?(r.is_active?"노출 중":"숨김"):tab==="reviews"?(r.is_approved?"승인됨":"승인 대기"):(r.is_published?"게시 중":"비공개")}</button><button onClick={()=>remove(r.id)}>삭제</button></div></article>)}</div></>}
 <div className="adminForm"><h2>카카오톡 상담 링크</h2><label>오픈채팅 URL<input value={kakao} onFocus={loadKakao} onChange={e=>setKakao(e.target.value)} placeholder="https://open.kakao.com/o/..."/></label><button className="btn" onClick={saveKakao}>링크 저장</button></div>
 </section></div></main>;
}

function Applications(){
  const [items,setItems]=useState<any[]>([]);
  const [msg,setMsg]=useState("문의 목록을 불러오는 중...");

  useEffect(()=>{
    (async()=>{
      if(!supabase)return;

      const {data,error}=await supabase
        .from("applications")
        .select("*")
        .order("created_at",{ascending:false});

      if(error){
        setMsg("조회 오류: "+error.message);
        return;
      }

      setItems(data||[]);
      setMsg(data?.length ? "" : "데이터가 없습니다.");
    })();
  },[]);

  return <>
    <h2>상품 문의 및 신청</h2>
    {msg&&<p>{msg}</p>}
    <div className="adminRows">
      {items.map(x=>(
        <article key={x.id}>
          <div>
            <b>{x.nickname} · {x.category}</b>
            <p>{x.details}</p>
            <small>
              {x.contact} · {x.created_at ? new Date(x.created_at).toLocaleString("ko-KR") : ""}
            </small>
          </div>
        </article>
      ))}
    </div>
  </>;
}
function Purchases(){
  const [items,setItems]=useState<any[]>([]);
  const [msg,setMsg]=useState("구매 내역을 불러오는 중...");

  async function loadPurchases(){
    if(!supabase)return;

    const {data,error}=await supabase
      .from("purchases")
      .select("*")
      .order("created_at",{ascending:false});

    if(error){
      setMsg("조회 오류: "+error.message);
      return;
    }

    setItems(data||[]);
    setMsg(data?.length ? "" : "구매 내역이 없습니다.");
  }

  useEffect(()=>{
    loadPurchases();
  },[]);

  async function approve(id:string){
    if(!supabase)return;

    const {data,error}=await supabase.rpc(
      "approve_purchase",
      {p_purchase_id:id}
    );

    if(error){
      setMsg("승인 오류: "+error.message);
      return;
    }

    setMsg(`${data}P 적립이 완료되었습니다.`);
    loadPurchases();
  }

  return <>
    <h2>포인트 관리</h2>
    {msg&&<p>{msg}</p>}
    <div className="adminRows">
      {items.map(x=>(
        <article key={x.id}>
          <div>
            <b>구매 금액: {Number(x.amount).toLocaleString("ko-KR")}원</b>
            <p>회원 ID: {x.user_id}</p>
            <p>적립 포인트: {x.points_awarded}P</p>
            <p>상태: {x.status==="pending"?"승인 대기":x.status==="approved"?"승인 완료":"취소"}</p>
            <small>{x.description||"구매 내역"} · {new Date(x.created_at).toLocaleString("ko-KR")}</small>
          </div>
          {x.status==="pending"&&(
            <button onClick={()=>approve(x.id)}>3% 포인트 승인</button>
          )}
        </article>
      ))}
    </div>
  </>;
}
