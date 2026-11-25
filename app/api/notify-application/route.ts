import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { nickname, category, contact, details } = await request.json();

    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!apiKey || !adminEmail) {
      return NextResponse.json(
        { error: "이메일 설정이 없습니다." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
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

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend 오류:", error);
      return NextResponse.json(
        { error: "이메일 발송 실패" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "서버 오류" },
      { status: 500 }
    );
  }
}
