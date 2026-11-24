# SA RIPPER 홈페이지 + 관리자 페이지 스타터

이 프로젝트는 `sa-ripper.com`에 배포할 수 있도록 만든 Next.js + Supabase 기반 시작 프로젝트입니다.

## 포함 기능
- 블랙/레드 반응형 공개 홈페이지
- Supabase에 저장되는 서비스/가격, 공지, 이벤트, 후기 표시
- `/admin` 아이디(이메일)+비밀번호 로그인
- 관리자 서비스/가격 등록, 노출 전환, 삭제
- 공지/이벤트 등록, 게시/비공개 전환, 삭제
- 후기 등록 후 관리자 승인/숨김
- 고객 신청/문의 접수 및 관리자 열람
- 카카오톡 상담 링크 설정

## 1. Supabase 준비
1. Supabase에서 새 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다.
3. Authentication > Users에서 관리자 이메일/비밀번호 계정을 생성합니다.
4. 해당 사용자의 UUID를 복사합니다.
5. SQL Editor에서 아래 쿼리를 UUID에 맞게 실행합니다.
   `insert into public.admin_profiles(user_id, role) values ('관리자-UUID', 'admin');`
6. Project Settings > API에서 Project URL과 anon/public key를 확인합니다.

## 2. 로컬 실행
1. Node.js LTS를 설치합니다.
2. 이 폴더에서 `.env.example`을 복사해 `.env.local`로 이름을 바꿉니다.
3. Supabase URL과 anon key를 입력합니다.
4. 터미널에서 실행합니다.
   - `npm install`
   - `npm run dev`
5. `http://localhost:3000`에서 홈페이지, `http://localhost:3000/admin`에서 관리자 페이지를 확인합니다.

## 3. 실제 도메인 연결
1. Vercel에 로그인하고 이 프로젝트를 배포합니다.
2. Vercel 프로젝트 Settings > Domains에서 `sa-ripper.com`을 추가합니다.
3. Vercel이 안내하는 DNS 레코드를 도메인 구매처 DNS 설정에 입력합니다.
4. Vercel 프로젝트 Environment Variables에 `.env.local`의 두 값을 등록하고 재배포합니다.
5. 도메인 DNS와 HTTPS가 정상 적용됐는지 확인합니다.

## 중요 보안 및 운영 메모
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 공개 클라이언트 키이며, 데이터 보호는 반드시 Supabase RLS 정책이 담당합니다.
- Supabase `service_role` 키는 절대로 브라우저 코드나 `NEXT_PUBLIC_` 환경변수에 넣지 마세요.
- 관리자 계정은 Supabase Authentication에서 생성하고, `admin_profiles`에 해당 UUID를 등록해야 합니다.
- 고객 신청은 공개 INSERT만 허용하고, 조회는 관리자만 가능하도록 RLS를 적용했습니다.
- 실시간 문의 채팅, 신청 상태 변경/답변, 이미지 업로드, 카카오톡 API 연동은 후속 개발 항목입니다. 현재 문의는 데이터베이스 접수 방식입니다.
- 후기 등록 기능은 방문자용 폼이 아직 없으며, 관리자가 등록하고 승인할 수 있는 구조입니다.
- 게임 계정 비밀번호 등 민감한 계정정보를 수집하지 마세요.
- 실제 운영 전에 게임사 이용약관, 관련 법령, 개인정보 처리방침/수집 동의를 검토하세요.

## 수정 방법
- 화면 디자인: `app/globals.css`
- 공개 홈페이지: `components/Site.tsx`
- 관리자 페이지: `components/Admin.tsx`
- 데이터베이스 및 접근 정책: `supabase/schema.sql`
