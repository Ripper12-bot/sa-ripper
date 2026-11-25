
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { title, body, accessToken } = await request.json();

    if (!title || !body || !accessToken) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const webhookUrl = process.env.DISCORD_REVIEW_WEBHOOK_URL;

    if (!supabaseUrl || !supabaseKey || !webhookUrl) {
      return NextResponse.json(
        { error: "서버 환경변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return NextResponse.json(
        { error: "로그인이 확인되지 않았습니다." },
        { status: 401 }
      );
    }

    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: "새로운 고객 후기가 등록되었습니다.",
            color: 5763719,
            fields: [
              {
                name: "작성자",
                value: data.user.email || "회원",
              },
              {
                name: "후기 제목",
                value: String(title).slice(0, 256),
              },
              {
                name: "후기 내용",
                value: String(body).slice(0, 1000),
              },
            ],
            footer: {
              text: "SA RIPPER 후기 알림",
            },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!discordResponse.ok) {
      return NextResponse.json(
        { error: "디스코드 알림 전송에 실패했습니다." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "후기 알림 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
