
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

  const [user,setUser] = useState<any>(null);
  const [authMode,setAuthMode] = useState<"signup"|"login">("signup");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [authMessage,setAuthMessage] = useState("");
  const [authBusy,setAuthBusy] = useState(false);
  const [reviewTitle,setReviewTitle] = useState("");
  const [reviewBody,setReviewBody] = useState("");
  const [reviewMessage,setReviewMessage] = useState("");
  const [reviewBusy,setReviewBusy] = useState(false);
  useEffect(()=>{
    if (!supabase) return;

    supabase.auth.getSession().then(({data})=>{
      setUser(data.session?.user ?? null);
    });

    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session)=>{
      setUser(session?.user ?? null);
    });

    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{ (async()=>{
    if (!supabase) {
      setStatus("Supabase 연결 전입니다. 설정 안내는 README를 확인하세요.");
      return;
    }

    const [s,n,e,r,settings] = await Promise.all([
      supabase.from("services").select("*").eq("is_active",true).order("sort_order"),
      supabase.from("notices").select("*").eq("is_published",true).order("created_at",{ascending:false}).limit(5),
      supabase.from("events").select("*").eq("is_published",true).order("created_at",{ascending:false}).limit(5),
      supabase.from("reviews").select("*").eq("is_approved",true).order("created_at",{ascending:false}).limit(6),
      supabase.from("site_settings").select("value").eq("key","kakao_url").maybeSingle()
    ]);

    if(s.data) setServices(s.data);
    if(n.data) setNotices(n.data);
    if(e.data) setEvents(e.data);
    if(r.data) setReviews(r.data);
    if(settings.data?.value) setKakao(settings.data.value);

    setStatus("SA RIPPER 공식 서비스 안내");
  })(); },[]);

  async function handleAuth(e:React.FormEvent) {
    e.preventDefault();
    setAuthMessage("");

    if(!supabase) {
      setAuthMessage("사이트 연결 상태를 확인해 주세요.");
      return;
    }

    setAuthBusy(true);

    try {
      if(authMode==="signup") {
        const {data,error} = await supabase.auth.signUp({
          email,
          password,
          options:{
            emailRedirectTo:window.location.origin
          }
        });

        if(error) {
          setAuthMessage("회원가입 실패: "+error.message);
        } else if(!data.session) {
          setAuthMessage("인증 이메일을 보냈습니다. 이메일함에서 인증 링크를 눌러주세요.");
          setPassword("");
        } else {
          setAuthMessage("회원가입이 완료되었습니다.");
        }
      } else {
        const {error} = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if(error) {
          setAuthMessage("로그인 실패: 이메일과 비밀번호를 확인해 주세요.");
        } else {
          setAuthMessage("로그인되었습니다.");
          setPassword("");
        }
      }
    } catch {
      setAuthMessage("요청 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    if(!supabase) return;
    const {error} = await supabase.auth.signOut();
    setAuthMessage(error ? "로그아웃에 실패했습니다." : "로그아웃되었습니다.");
  }

 async function submitReview(e:React.FormEvent) {
  e.preventDefault();
  setReviewMessage("");

  if(!supabase || !user) {
    setReviewMessage("로그인 후 이용해 주세요.");
    return;
  }

  if(!reviewTitle.trim() || !reviewBody.trim()) {
    setReviewMessage("제목과 후기 내용을 입력해 주세요.");
    return;
  }

  setReviewBusy(true);

  try {
    const {data:sessionData} = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if(!accessToken) {
      setReviewMessage("로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.");
      return;
    }

    const {error} = await supabase.from("reviews").insert({
      user_id:user.id,
      title:reviewTitle.trim(),
      body:reviewBody.trim(),
      is_approved:false
    });

    if(error) {
      setReviewMessage("후기 등록 실패: " + error.message);
      return;
    }

    try {
      const response = await fetch("/api/notify-review", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          title:reviewTitle.trim(),
          body:reviewBody.trim(),
          accessToken
        })
      });

      if(response.ok) {
        setReviewMessage("후기가 접수되었습니다. 관리자 승인 후 공개됩니다.");
      } else {
        setReviewMessage("후기는 접수되었습니다. 디스코드 알림 전송은 실패했습니다.");
      }
    } catch {
      setReviewMessage("후기는 접수되었습니다. 디스코드 알림 전송은 실패했습니다.");
    }

    setReviewTitle("");
    setReviewBody("");
  } finally {
    setReviewBusy(false);
  }
}
async function submit(e:React.FormEvent) {
  e.preventDefault();
  setSent("");

  if(!supabase) {
    setSent("사이트 데이터 연결이 아직 완료되지 않았습니다.");
    return;
  }

  const {error}=await supabase.from("applications").insert({
    user_id:user?.id ?? null,
    nickname:form.nickname,
    category:form.category,
    contact:form.contact,
    details:form.details
  });

  if(error) {
    console.error("문의 접수 오류:", error);
    setSent("접수 실패: " + error.message);
    return;
  }

  try {
    const emailResponse = await fetch("/api/notify-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if(!emailResponse.ok) {
      setSent("문의는 접수되었습니다. 이메일 알림은 전송되지 않았습니다.");
    } else {
      setSent("문의가 접수되었습니다. 관리자에게 이메일 알림을 보냈습니다.");
    }
  } catch(error) {
    console.error("이메일 알림 오류:", error);
    setSent("문의는 접수되었습니다. 이메일 알림은 전송되지 않았습니다.");
  }

  setForm({nickname:"",category:"서비스 문의",contact:"",details:""});
}


  return <main>
    <header>
      <div className="wrap nav">
        <a className="logo" href="#">SA <b>RIPPER</b></a>
        <nav>
          <a href="#service">서비스</a>
          <a href="#price">가격표</a>
          <a href="#apply">신청</a>
          <a href="#review">후기</a>
          <a href="#notice">공지</a>
          <a href="#event">이벤트</a>
          <a href="#account">회원</a>
        </nav>
        <a className="navbtn" href="/admin">관리자</a>
      </div>
    </header>

    <section className="hero">
      <div className="wrap heroContent">
        <p className="eyebrow">SUDDEN ATTACK · SPECIALIZED SERVICE</p>
        <h1>PLAY HARD.<br/><span>RISE HIGH.</span></h1>
        <p className="lead">SA RIPPER — 서든어택 전문 서비스 안내 및 상담</p>
        <p className="muted">{status}</p>
        <div className="actions">
          <a className="btn" href="#service">서비스 보기</a>
          <a className="btn ghost" href="#apply">문의하기</a>
        </div>
        <div className="heroMark">SA</div>
      </div>
    </section>

    <section id="account" className="section alt">
      <div className="wrap">
        <div className="heading">
          <small>MEMBER ACCOUNT</small>
          <h2>회원 서비스</h2>
          <p>회원가입 후 이메일 인증을 완료해 주세요.</p>
        </div>

        <div className="form">
          {user ? <>
            <h3>로그인되었습니다.</h3>
            <p>{user.email}</p>
            <button className="btn" type="button" onClick={handleLogout}>로그아웃</button>
          </> : <>
            <div className="actions">
              <button className="btn" type="button" onClick={()=>{
                setAuthMode("signup");
                setAuthMessage("");
              }}>회원가입</button>
              <button className="btn ghost" type="button" onClick={()=>{
                setAuthMode("login");
                setAuthMessage("");
              }}>로그인</button>
            </div>

            <h3>{authMode==="signup" ? "이메일 회원가입" : "이메일 로그인"}</h3>

            <form onSubmit={handleAuth}>
              <label>
                이메일
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  autoComplete="email"
                />
              </label>

              <label>
                비밀번호
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  placeholder="8자 이상 입력"
                  autoComplete={authMode==="signup" ? "new-password" : "current-password"}
                />
              </label>

              <button className="btn" type="submit" disabled={authBusy}>
                {authBusy ? "처리 중..." : authMode==="signup" ? "회원가입하기" : "로그인하기"}
              </button>
            </form>
          </>}

          {authMessage && <p className="formStatus">{authMessage}</p>}
        </div>
      </div>
    </section>

    <section id="service" className="section">
      <div className="wrap">
        <div className="heading">
          <small>OUR SERVICE</small>
          <h2>서비스 카테고리</h2>
          <p>운영자가 등록한 서비스를 확인하고 문의하세요.</p>
        </div>
        <div className="cards">
          {services.length ? services.map(x=><article className="card" key={x.id}>
            <small>{x.category||"SA SERVICE"}</small>
            <h3>{x.title}</h3>
            <p>{x.description}</p>
          </article>) : <article className="card">
            <small>SA SERVICE</small>
            <h3>서비스 준비 중</h3>
            <p>관리자 페이지에서 서비스를 등록하면 이곳에 표시됩니다.</p>
          </article>}
        </div>
      </div>
    </section>

    <section id="price" className="section alt">
      <div className="wrap">
        <div className="heading">
          <small>PRICE GUIDE</small>
          <h2>가격 안내</h2>
          <p>가격은 관리자 페이지에서 언제든지 변경할 수 있습니다.</p>
        </div>
        <div className="cards">
          {services.length ? services.map(x=><article className="priceCard" key={x.id}>
            <small>{x.category||"SERVICE"}</small>
            <h3>{x.title}</h3>
            <strong>{x.price||"상담 후 안내"}</strong>
            <p>{x.description}</p>
            <a className="btn full" href="#apply">문의하기</a>
          </article>) : <div className="card">
            <h3>등록된 가격표가 없습니다.</h3>
            <p>관리자 페이지에서 서비스와 가격을 추가해 주세요.</p>
          </div>}
        </div>
      </div>
    </section>

    <section id="apply" className="section">
      <div className="wrap">
        <div className="heading">
          <small>APPLICATION</small>
          <h2>서비스 신청 / 실시간 문의</h2>
          <p>계정 비밀번호 등 민감한 정보는 입력하지 마세요.</p>
        </div>
        <form className="form" onSubmit={submit}>
          <label>닉네임<input required value={form.nickname} onChange={e=>setForm({...form,nickname:e.target.value})} placeholder="문의자 닉네임"/></label>
          <label>문의 종류<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>서비스 문의</option>{services.map(s=><option key={s.id}>{s.title}</option>)}<option>기타 문의</option></select></label>
          <label>연락 수단 (선택)<input value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} placeholder="오픈채팅 등 연락 가능한 수단"/></label>
          <label>문의 내용<textarea required value={form.details} onChange={e=>setForm({...form,details:e.target.value})} placeholder="원하는 서비스와 문의 내용을 적어주세요."/></label>
          <button className="btn" type="submit">문의 접수하기 ↗</button>
          {sent&&<p className="formStatus">{sent}</p>}
        </form>
      </div>
    </section>

    <section id="review" className="section alt">
      <div className="wrap">
        <div className="heading"><small>PLAYER VOICE</small><h2>이용 후기</h2></div>
       {user ? (
  <form className="form" onSubmit={submitReview}>
    <h3>후기 작성하기</h3>

    <label>
      후기 제목
      <input
        required
        value={reviewTitle}
        onChange={e=>setReviewTitle(e.target.value)}
        placeholder="후기 제목을 입력하세요."
      />
    </label>

    <label>
      후기 내용
      <textarea
        required
        value={reviewBody}
        onChange={e=>setReviewBody(e.target.value)}
        placeholder="서비스 이용 후기를 작성해 주세요."
      />
    </label>

    <button className="btn" type="submit" disabled={reviewBusy}>
      {reviewBusy ? "등록 중..." : "후기 등록하기"}
    </button>

    {reviewMessage && <p className="formStatus">{reviewMessage}</p>}
    <p className="muted">작성한 후기는 관리자 승인 후 공개됩니다.</p>
  </form>
) : (
  <div className="card">
    <p>후기를 작성하려면 먼저 로그인해 주세요.</p>
    <a className="btn" href="#account">로그인하기</a>
  </div>
)}
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
<div className="cards">
          {reviews.length ? reviews.map(x=><article className="card" key={x.id}>
            <p>{x.body}</p><h3>{x.title}</h3>
          </article>) : <article className="card">
            <h3>등록된 후기가 없습니다.</h3>
            <p>관리자 승인 후 공개된 후기가 표시됩니다.</p>
          </article>}
        </div>
      </div>
    </section>

    <section id="notice" className="section">
      <div className="wrap">
        <div className="heading"><small>NOTICE</small><h2>공지사항</h2></div>
        <div className="rows">
          {notices.length ? notices.map(x=><article className="row" key={x.id}>
            <b>{x.title}</b>
            <span>{new Date(x.created_at).toLocaleDateString("ko-KR")}</span>
            <p>{x.body}</p>
          </article>) : <div className="row">등록된 공지사항이 없습니다.</div>}
        </div>
      </div>
    </section>

    <section id="event" className="section alt">
      <div className="wrap">
        <div className="heading"><small>SPECIAL EVENT</small><h2>이벤트</h2></div>
        <div className="cards">
          {events.length ? events.map(x=><article className="card" key={x.id}>
            <small>EVENT</small><h3>{x.title}</h3><p>{x.body}</p>
          </article>) : <article className="card">
            <h3>진행 중인 이벤트가 없습니다.</h3>
            <p>새로운 이벤트는 이곳에 표시됩니다.</p>
          </article>}
        </div>
      </div>
    </section>

    <section className="contact">
      <div className="wrap contactInner">
        <div>
          <small>CONTACT SA RIPPER</small>
          <h2>궁금한 점이 있으신가요?</h2>
          <p>카카오톡 상담 채널에서 문의할 수 있습니다.</p>
        </div>
        <a className="btn" href={kakao} target="_blank" rel="noreferrer">카카오톡 상담 ↗</a>
      </div>
    </section>

    <footer>
      <div className="wrap footer">
        <a className="logo" href="#">SA <b>RIPPER</b></a>
        <span>© 2026 SA RIPPER. All rights reserved.</span>
      </div>
      <div className="wrap footnote">본 사이트는 서든어택 관련 서비스 안내 페이지입니다. 게임사 이용약관 및 관련 법령을 확인하고 준수하세요.</div>
    </footer>
  </main>;
}
