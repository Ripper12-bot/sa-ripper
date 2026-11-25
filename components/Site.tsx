
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Item = {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  category: string | null;
  created_at?: string;
};

type Post = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

const tiers = [
  { name: "브론즈", images: ["bronze-1.png", "bronze-2.png", "bronze-3.png"] },
  { name: "실버", images: ["silver-1.png", "silver-2.png", "silver-3.png"] },
  { name: "골드", images: ["gold-1.png", "gold-2.png", "gold-3.png"] },
  { name: "마스터", images: ["master.png"] },
  { name: "그랜드마스터", images: ["grandmaster.png"] },
  { name: "레전드", images: ["legend.png"] },
  { name: "불레전드", images: ["fire-legend.png"] },
  { name: "별레전드", images: ["star-legend.png"] }
];

export default function Site() {
    const [showIntro, setShowIntro] = useState(false);
  const [introReady, setIntroReady] = useState(false);
  const [introLeaving, setIntroLeaving] = useState(false);
  
  const [services, setServices] = useState<Item[]>([]);
  const [notices, setNotices] = useState<Post[]>([]);
  const [events, setEvents] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Post[]>([]);
  const [status, setStatus] = useState("SA RIPPER 공식 서비스 안내");
  const [form, setForm] = useState({
    nickname: "",
    category: "서비스 문의",
    contact: "",
    details: ""
  });
  const [sent, setSent] = useState("");
  const [kakao, setKakao] = useState("https://open.kakao.com/o/g7uT2zYi");

  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

   useEffect(() => {
    const visited = localStorage.getItem("sa-ripper-visited");

    if (!visited) {
      setShowIntro(true);
    }

    setIntroReady(true);
  }, []);

  const enterSite = () => {
  localStorage.setItem("sa-ripper-visited", "true");
  setIntroLeaving(true);

  window.setTimeout(() => {
    setShowIntro(false);
  }, 650);
};
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      if (!supabase) {
        setStatus("Supabase 연결 전입니다. 설정 안내는 README를 확인하세요.");
        return;
      }

      const [s, n, e, r, settings] = await Promise.all([
        supabase.from("services").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("notices").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(5),
        supabase.from("events").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(5),
        supabase.from("reviews").select("*").eq("is_approved", true).order("created_at", { ascending: false }).limit(6),
        supabase.from("site_settings").select("value").eq("key", "kakao_url").maybeSingle()
      ]);

      if (s.data) setServices(s.data);
      if (n.data) setNotices(n.data);
      if (e.data) setEvents(e.data);
      if (r.data) setReviews(r.data);
      if (settings.data?.value) setKakao(settings.data.value);

      setStatus("SA RIPPER 공식 서비스 안내");
    })();
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthMessage("");

    if (!supabase) {
      setAuthMessage("사이트 연결 상태를 확인해 주세요.");
      return;
    }

    setAuthBusy(true);

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin }
        });

        if (error) {
          setAuthMessage("회원가입 실패: " + error.message);
        } else if (!data.session) {
          setAuthMessage("인증 이메일을 보냈습니다. 이메일함에서 인증 링크를 눌러주세요.");
          setPassword("");
        } else {
          setAuthMessage("회원가입이 완료되었습니다.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
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
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    setAuthMessage(error ? "로그아웃에 실패했습니다." : "로그아웃되었습니다.");
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewMessage("");

    if (!supabase || !user) {
      setReviewMessage("로그인 후 이용해 주세요.");
      return;
    }

    if (!reviewTitle.trim() || !reviewBody.trim()) {
      setReviewMessage("제목과 후기 내용을 입력해 주세요.");
      return;
    }

    setReviewBusy(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setReviewMessage("로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.");
        return;
      }

      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        title: reviewTitle.trim(),
        body: reviewBody.trim(),
        is_approved: false
      });

      if (error) {
        setReviewMessage("후기 등록 실패: " + error.message);
        return;
      }

      try {
        const response = await fetch("/api/notify-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: reviewTitle.trim(),
            body: reviewBody.trim(),
            accessToken
          })
        });

        setReviewMessage(
          response.ok
            ? "후기가 접수되었습니다. 관리자 승인 후 공개됩니다."
            : "후기는 접수되었습니다. 디스코드 알림 전송은 실패했습니다."
        );
      } catch {
        setReviewMessage("후기는 접수되었습니다. 디스코드 알림 전송은 실패했습니다.");
      }

      setReviewTitle("");
      setReviewBody("");
    } finally {
      setReviewBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSent("");

    if (!supabase) {
      setSent("사이트 데이터 연결이 아직 완료되지 않았습니다.");
      return;
    }

    const { error } = await supabase.from("applications").insert({
      user_id: user?.id ?? null,
      nickname: form.nickname,
      category: form.category,
      contact: form.contact,
      details: form.details
    });

    if (error) {
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

      setSent(
        emailResponse.ok
          ? "문의가 접수되었습니다. 관리자에게 이메일 알림을 보냈습니다."
          : "문의는 접수되었습니다. 이메일 알림은 전송되지 않았습니다."
      );
    } catch (error) {
      console.error("이메일 알림 오류:", error);
      setSent("문의는 접수되었습니다. 이메일 알림은 전송되지 않았습니다.");
    }

    setForm({ nickname: "", category: "서비스 문의", contact: "", details: "" });
  }

  return (
  <>
    {introReady && showIntro && (
     <div className={`introScreen${introLeaving ? " leaving" : ""}`}>
        <div className="introContent">
          <p className="introLabel">SUDDEN ATTACK RANK SERVICE</p>
          <h1>SA <strong>RIPPER</strong></h1>
          <p>당신의 새로운 시작</p>
          <button onClick={enterSite}>
            사이트 둘러보기 →
          </button>
        </div>
      </div>
    )}

    <main
      className="siteHome"
      style={{ display: !introReady || showIntro ? "none" : "block" }}
    >
    <header className="siteHeader">
      <div className="wrap siteNav">
        <a className="logo" href="#">
          ♛ SA <b>RIPPER</b>
        </a>
        <nav className="mainNav">
          <a href="#">HOME</a>
          <a href="#tier">RANK</a>
          <a href="#service">SERVICE</a>
          <a href="#notice">NOTICE</a>
          <a href="#review">REVIEW</a>
        </nav>
        <a className="loginNav" href="#account">
          {user ? "MY ACCOUNT" : "LOGIN"}
        </a>
      </div>
    </header>

    <section className="mainHero">
      <div className="wrap heroInner">
        <div className="heroText">
          <span className="heroPill">SUDDEN ATTACK RANK SERVICE</span>
          <p className="heroLogo">SA <strong>RIPPER</strong></p>
          <h1>
            한계를 넘어
            <br />
            <em>최고의 랭크</em>를 향해
          </h1>
          <p className="heroDescription">
            당신의 랭크 상승을 위한 특별한 경험
          </p>
          <a className="heroButton" href="#service">
            서비스 둘러보기 →
          </a>
        </div>
      
      </div>
    </section>
         
    <section className="homeHighlights">
      <div className="wrap">
        <div className="heading">
          <small>SA RIPPER CONTENTS</small>
          <h2>빠른 메뉴</h2>
        </div>
        <div className="highlightGrid">
          <a className="highlightPanel" href="#service">
            <span>01</span>
            <h2>서비스 안내</h2>
            <p>다양한 상품 확인하기 →</p>
          </a>
          <a className="highlightPanel" href="#notice">
            <span>02</span>
            <h2>공지사항</h2>
            <p>최신 소식 확인하기 →</p>
          </a>
          <a className="highlightPanel" href="#review">
            <span>03</span>
            <h2>이용 후기</h2>
            <p>고객 후기 확인하기 →</p>
          </a>
        </div>
      </div>
    </section>

    <section id="service" className="section">
      <div className="wrap">
        <div className="heading">
          <small>OUR SERVICE</small>
          <h2>상품 및 서비스</h2>
          <p>SA RIPPER의 서비스 상품을 확인하세요.</p>
        </div>
        <div className="cards">
          {services.length ? services.map((item) => (
            <article className="priceCard" key={item.id}>
              <small>{item.category || "SERVICE"}</small>
              <h3>{item.title}</h3>
              <strong>{item.price || "상담 후 안내"}</strong>
              <p>{item.description}</p>
              <a className="btn full" href="#apply">문의하기 →</a>
            </article>
          )) : (
            <article className="card">
              <h3>등록된 상품이 없습니다.</h3>
            </article>
          )}
        </div>
      </div>
    </section>

    <section id="account" className="section alt">
      <div className="wrap">
        <div className="heading">
          <small>MEMBER ACCOUNT</small>
          <h2>회원 서비스</h2>
        </div>
        <div className="form">
          {user ? (
            <>
              <h3>로그인되었습니다.</h3>
              <p>{user.email}</p>
              <button className="btn" type="button" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <div className="actions">
                <button className="btn" type="button" onClick={() => {
                  setAuthMode("signup");
                  setAuthMessage("");
                }}>회원가입</button>
                <button className="btn ghost" type="button" onClick={() => {
                  setAuthMode("login");
                  setAuthMessage("");
                }}>로그인</button>
              </div>
              <h3>{authMode === "signup" ? "이메일 회원가입" : "이메일 로그인"}</h3>
              <form onSubmit={handleAuth}>
                <label>이메일
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일 주소" />
                </label>
                <label>비밀번호
                  <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="8자 이상 입력" />
                </label>
                <button className="btn" type="submit" disabled={authBusy}>
                  {authBusy ? "처리 중..." : authMode === "signup" ? "회원가입하기" : "로그인하기"}
                </button>
              </form>
            </>
          )}
          {authMessage && <p className="formStatus">{authMessage}</p>}
        </div>
      </div>
    </section>

    <section id="apply" className="section">
      <div className="wrap">
        <div className="heading">
          <small>APPLICATION</small>
          <h2>서비스 신청 및 문의</h2>
        </div>
        <form className="form" onSubmit={submit}>
          <label>닉네임
            <input required value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
          </label>
          <label>문의 종류
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option>서비스 문의</option>
              {services.map(s => <option key={s.id}>{s.title}</option>)}
              <option>기타 문의</option>
            </select>
          </label>
          <label>연락 수단
            <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="연락 가능한 수단" />
          </label>
          <label>문의 내용
            <textarea required value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} />
          </label>
          <button className="btn" type="submit">문의 접수하기 →</button>
          {sent && <p className="formStatus">{sent}</p>}
        </form>
      </div>
    </section>

    <section id="review" className="section alt">
      <div className="wrap">
        <div className="heading">
          <small>PLAYER VOICE</small>
          <h2>이용 후기</h2>
        </div>
        {user ? (
          <form className="form" onSubmit={submitReview}>
            <h3>후기 작성하기</h3>
            <label>후기 제목
              <input required value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} />
            </label>
            <label>후기 내용
              <textarea required value={reviewBody} onChange={e => setReviewBody(e.target.value)} />
            </label>
            <button className="btn" type="submit" disabled={reviewBusy}>
              {reviewBusy ? "등록 중..." : "후기 등록하기"}
            </button>
            {reviewMessage && <p className="formStatus">{reviewMessage}</p>}
            <p className="muted">후기는 관리자 승인 후 공개됩니다.</p>
          </form>
        ) : (
          <div className="card">
            <p>후기를 작성하려면 먼저 로그인해 주세요.</p>
            <a className="btn" href="#account">로그인하기</a>
          </div>
        )}
        <div className="cards">
          {reviews.length ? reviews.map(item => (
            <article className="card" key={item.id}>
              <p>{item.body}</p>
              <h3>{item.title}</h3>
            </article>
          )) : <article className="card">등록된 후기가 없습니다.</article>}
        </div>
      </div>
    </section>

    <section id="notice" className="section">
      <div className="wrap">
        <div className="heading">
          <small>NOTICE</small>
          <h2>공지사항</h2>
        </div>
        <div className="rows">
          {notices.length ? notices.map(item => (
            <article className="row" key={item.id}>
              <b>{item.title}</b>
              <span>{new Date(item.created_at).toLocaleDateString("ko-KR")}</span>
              <p>{item.body}</p>
            </article>
          )) : <div className="row">등록된 공지사항이 없습니다.</div>}
        </div>
      </div>
    </section>

    <section id="event" className="section alt">
      <div className="wrap">
        <div className="heading">
          <small>SPECIAL EVENT</small>
          <h2>이벤트</h2>
        </div>
        <div className="cards">
          {events.length ? events.map(item => (
            <article className="card" key={item.id}>
              <small>EVENT</small>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          )) : <article className="card">진행 중인 이벤트가 없습니다.</article>}
        </div>
      </div>
    </section>

    <section id="contact" className="contactBanner">
      <div className="wrap contactBannerInner">
        <div className="contactBannerText">
          <div>
            <h2>지금 바로 상담하세요!</h2>
            <p>궁금한 점은 언제든지 문의해 주세요.</p>
          </div>
        </div>
        <div className="contactButtons">
          <a className="kakaoButton" href={kakao} target="_blank" rel="noreferrer">
            카카오톡 상담 →
          </a>
          <a className="discordButton" href="https://discord.gg/V8uzyT9zW" target="_blank" rel="noreferrer">
            디스코드 참여 →
          </a>
        </div>
      </div>
    </section>

    <footer className="siteFooter">
      <div className="wrap footer">
        <a className="logo" href="#">♛ SA <b>RIPPER</b></a>
        <span>© 2026 SA RIPPER. All rights reserved.</span>
      </div>
      <div className="wrap footnote">
        본 사이트는 서든어택 관련 서비스 안내 페이지입니다.
      </div>
    </footer>
   </main>
  </>
);
}
