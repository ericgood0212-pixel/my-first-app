import { NextResponse } from "next/server";
import { courses } from "@/data/courses";

export async function POST(request) {
  try {
    const body = await request.json();
    const { courseId, course: courseName, name, phone, people } = body;

    // 1. 이름 유효성 검사
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "이름을 입력해 주세요." },
        { status: 400 }
      );
    }

    // 2. 연락처 유효성 검사
    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json(
        { success: false, message: "연락처를 입력해 주세요." },
        { status: 400 }
      );
    }

    // 3. 신청 인원 숫자 변환 및 검증
    const numPeople = Number(people);
    if (!Number.isInteger(numPeople) || numPeople < 1) {
      return NextResponse.json(
        { success: false, message: "신청 인원은 1명 이상의 정수여야 합니다." },
        { status: 400 }
      );
    }

    // 4. 강좌 정보 조회 (courseId 또는 courseName 기준)
    const targetCourse = courses.find(
      (c) =>
        (courseId !== undefined && c.id === Number(courseId)) ||
        (courseName && c.name.trim() === courseName.trim())
    );

    if (!targetCourse) {
      return NextResponse.json(
        { success: false, message: "존재하지 않는 강좌입니다." },
        { status: 404 }
      );
    }

    // 5. 남은 좌석 검증
    const remainingSeats = targetCourse.seat - targetCourse.booked;
    if (remainingSeats <= 0) {
      return NextResponse.json(
        { success: false, message: "이미 마감된 강좌입니다." },
        { status: 400 }
      );
    }

    if (numPeople > remainingSeats) {
      return NextResponse.json(
        {
          success: false,
          message: `신청 인원이 남은 좌석(${remainingSeats}석)을 초과했습니다.`,
        },
        { status: 400 }
      );
    }

    // 6. 보안 처리: 결제 금액(total)을 서버가 data/courses.js의 수강료 × 신청 인원으로 직접 계산
    const total = targetCourse.price * numPeople;

    // 7. 스프레드시트로 전송할 JSON 데이터
    const sheetPayload = {
      date: targetCourse.date,
      course: targetCourse.name,
      name: name.trim(),
      phone: phone.trim(),
      people: numPeople,
      total: total,
    };

    // 8. .env의 SHEET_URL 확인
    const sheetUrl = process.env.SHEET_URL;
    if (!sheetUrl) {
      console.error("환경 변수 SHEET_URL이 설정되어 있지 않습니다.");
      return NextResponse.json(
        {
          success: false,
          message: "서버 설정 오류: SHEET_URL 환경변수가 누락되었습니다.",
        },
        { status: 500 }
      );
    }

    // 9. 구글 스프레드시트 Web App으로 POST 요청
    const sheetResponse = await fetch(sheetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sheetPayload),
      redirect: "follow",
    });

    if (!sheetResponse.ok) {
      const errorText = await sheetResponse.text().catch(() => "");
      console.error("구글 시트 연동 실패:", sheetResponse.status, errorText);
      return NextResponse.json(
        {
          success: false,
          message: "구글 스프레드시트 전송에 실패했습니다.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "예약 신청이 완료되었습니다.",
      data: sheetPayload,
    });
  } catch (error) {
    console.error("예약 처리 중 예외 발생:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "서버 내부 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

