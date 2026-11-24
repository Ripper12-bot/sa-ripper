"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Item = { id:string; title:string; description:string|null; price:string|null; category:string|null; created_at?:string };
type Post = { id:string; title:string; body:string; created_at:string };
export default function Site() {
  const [services,setServices] = useState<Item[]>([]);
  const [notices,setNotices] = useState<Post[]>([]);
  const [events,setEvents] = useState<Post[]>([]);
  const [reviews,setReviews] = useState<Post[]>([]);
  const [status,setStatus] = useState("서비스 정보를 불러오는 중입니다.");
  const [form,setForm] = useState({nickname:"",category:"서비스 문의",contact:"",details:""});
  const [sent,setSent] = useState("");
  const [kakao,setKakao] = useState("#apply");
  useEffect(()=>{ (async()=>{
    if (!supabase) { setStatus("Supabase 연결 전입니다. 설정 안내는 README를 확인하세요."); return; }
    const [s,n,e,r,settings] = await Promise.all([
      supabase.from("services").select("*").eq("is_active",true).order("sort_order"),
      supabase.from("notices").select("*").eq("is_published",true).order("created_at",{ascending:false}).limit(5),
      supabase.from("events").select("*").eq("is_published",true).order("created_at",{ascending:false}).limit(5),
      supabase.from("reviews").select("*").eq("is_approved",true).order("created_at",{ascending:false}).limit(6),
      supabase.from("site_settings").select("value").eq("key","kakao_url").maybeSingle()
    ]);
    if(s.data) setServices(s.data); if(n.data) setNotices(n.data); if(e.data) setEvents(e.data); if(r.data) setReviews(r.data);
    if(settings.data?.value) setKakao(settings.data.value);
    setStatus("SA RIPPER 공식 서비스 안내");
  })(); },[]);
  async function submit(e:React.FormEvent) {
    e.preventDefault(); setSent("");
    if(!supabase){setSent("사이트 데이터 연결이 아직 완료되지 않았습니다.");return;}
    const {error}=await supabase.from("applications").insert({nickname:form.nickname,category:form.category,contact:form.contact,details:form.details});
    if(error) setSent("접수에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    else {setSent("문의가 접수되었습니다. 확인 후 안내드리겠습니다.");setForm({nickname:"",category:"서비스 문의",contact:"",details:""});}
  }
  return <main>
    <header><div className="wrap nav"><a className="logo" href="#">SA <b>RIPPER</b></a><nav><a href="#service">서비스</a><a href="#price">가격표</a><a href="#apply">신청</a><a href="#review">후기</a><a href="#notice">공지</a><a href="#event">이벤트</a></nav><a className="navbtn" href="/admin">관리자</a></div></header>
    <section className="hero"><div className="wrap heroContent"><p className="eyebrow">SUDDEN ATTACK · SPECIALIZED SERVICE</p><h1>PLAY HARD.<br/><span>RISE HIGH.</span></h1><p className="lead">SA RIPPER — 서든어택 전문 서비스 안내 및 상담</p><p className="muted">{status}</p><div className="actions"><a className="btn" href="#service">서비스 보기</a><a className="btn ghost" href="#apply">문의하기</a></div><div className="heroMark">SA</div></div></section>
    <section id="service" className="section"><div className="wrap"><div className="heading"><small>OUR SERVICE</small><h2>서비스 카테고리</h2><p>운영자가 등록한 서비스를 확인하고 문의하세요.</p></div><div className="cards">{services.length?services.map(x=><article className="card" key={x.id}><small>{x.category||"SA SERVICE"}</small><h3>{x.title}</h3><p>{x.description}</p></article>):<article className="card"><small>SA SERVICE</small><h3>서비스 준비 중</h3><p>관리자 페이지에서 서비스를 등록하면 이곳에 표시됩니다.</p></article>}</div></div></section>
    <section id="price" className="section alt"><div className="wrap"><div className="heading"><small>PRICE GUIDE</small><h2>가격 안내</h2><p>가격은 관리자 페이지에서 언제든지 변경할 수 있습니다.</p></div><div className="cards">{services.length?services.map(x=><article className="priceCard" key={x.id}><small>{x.category||"SERVICE"}</small><h3>{x.title}</h3><strong>{x.price||"상담 후 안내"}</strong><p>{x.description}</p><a className="btn full" href="#apply">문의하기</a></article>):<div className="card"><h3>등록된 가격표가 없습니다.</h3><p>관리자 페이지에서 서비스와 가격을 추가해 주세요.</p></div>}</div></div></section>
    <section id="apply" className="section"><div className="wrap"><div className="heading"><small>APPLICATION</small><h2>서비스 신청 / 실시간 문의</h2><p>계정 비밀번호 등 민감한 정보는 입력하지 마세요.</p></div><form className="form" onSubmit={submit}><label>닉네임<input required value={form.nickname} onChange={e=>setForm({...form,nickname:e.target.value})} placeholder="문의자 닉네임"/></label><label>문의 종류<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>서비스 문의</option>{services.map(s=><option key={s.id}>{s.title}</option>)}<option>기타 문의</option></select></label><label>연락 수단 (선택)<input value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} placeholder="오픈채팅 등 연락 가능한 수단"/></label><label>문의 내용<textarea required value={form.details} onChange={e=>setForm({...form,details:e.target.value})} placeholder="원하는 서비스와 문의 내용을 적어주세요."/></label><button className="btn" type="submit">문의 접수하기 ↗</button>{sent&&<p className="formStatus">{sent}</p>}</form></div></section>
    <section id="review" className="section alt"><div className="wrap"><div className="heading"><small>PLAYER VOICE</small><h2>이용 후기</h2></div><div className="cards">{reviews.length?reviews.map(x=><article className="card" key={x.id}><p>{x.body}</p><h3>{x.title}</h3></article>):<article className="card"><h3>등록된 후기가 없습니다.</h3><p>관리자 승인 후 공개된 후기가 표시됩니다.</p></article>}</div></div></section>
    <section id="notice" className="section"><div className="wrap"><div className="heading"><small>NOTICE</small><h2>공지사항</h2></div><div className="rows">{notices.length?notices.map(x=><article className="row" key={x.id}><b>{x.title}</b><span>{new Date(x.created_at).toLocaleDateString("ko-KR")}</span><p>{x.body}</p></article>):<div className="row">등록된 공지사항이 없습니다.</div>}</div></div></section>
    <section id="event" className="section alt"><div className="wrap"><div className="heading"><small>SPECIAL EVENT</small><h2>이벤트</h2></div><div className="cards">{events.length?events.map(x=><article className="card" key={x.id}><small>EVENT</small><h3>{x.title}</h3><p>{x.body}</p></article>):<article className="card"><h3>진행 중인 이벤트가 없습니다.</h3><p>새로운 이벤트는 이곳에 표시됩니다.</p></article>}</div></div></section>
    <section className="contact"><div className="wrap contactInner"><div><small>CONTACT SA RIPPER</small><h2>궁금한 점이 있으신가요?</h2><p>카카오톡 상담 채널에서 문의할 수 있습니다.</p></div><a className="btn" href={kakao} target="_blank" rel="noreferrer">카카오톡 상담 ↗</a></div></section>
    <footer><div className="wrap footer"><a className="logo" href="#">SA <b>RIPPER</b></a><span>© 2026 SA RIPPER. All rights reserved.</span></div><div className="wrap footnote">본 사이트는 서든어택 관련 서비스 안내 페이지입니다. 게임사 이용약관 및 관련 법령을 확인하고 준수하세요.</div></footer>
  </main>;
}