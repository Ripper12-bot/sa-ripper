
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { nickname, category, contact, details } = await request.json();

    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;
    const discordWebhook = process.env.DISCORD_WEBHOOK_URL;

    if (!apiKey || !adminEmail) {
      return NextResponse.json(
        { error: "이메일 설정이 없습니다." },
        { status: 500 }
      );
    }

    // 관리자 이메일 알림
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SA RIPPER <noreply@sa-ripper.com>",
        to: [adminEmail],
        subject: `[SA RIPPER] 새 문의: ${category}`,
        text: `새 문의가 접수되었습니다.

닉네임: ${nickname}
문의 종류: ${category}
연락 수단: ${contact || "없음"}

문의 내용:
${details}`,
      }),
    });

    if (!emailResponse.ok) {
      console.error("Resend 오류:", await emailResponse.text());
      return NextResponse.json(
        { error: "이메일 발송 실패" },
        { status: 502 }
      );
    }

    // 디스코드 문의 알림
    let discordSent = false;

    if (discordWebhook) {
      const discordResponse = await fetch(discordWebhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `📩 **SA RIPPER 새 문의**

**닉네임:** ${nickname}
**문의 종류:** ${category}
**연락 수단:** ${contact || "없음"}

**문의 내용:**
${details}`,
          allowed_mentions: { parse: [] },
        }),
      });

      discordSent = discordResponse.ok;

      if (!discordSent) {
        console.error("디스코드 알림 전송 실패");
      }
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
      discordSent,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "서버 오류" },
      { status: 500 }
    );
  }
}
