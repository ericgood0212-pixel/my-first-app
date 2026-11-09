"use client";

import { useState } from "react";
import initialCourses from "@/data/courses";

export interface Course {
  id: number;
  name: string;
  price: number;
  seat: number;
  booked: number;
  date: string;
  tags: string[];
}

export default function Home() {
  const [courseList, setCourseList] = useState<Course[]>(initialCourses);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  // 예약 신청 모달 상태
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formName, setFormName] = useState<string>("");
  const [formPhone, setFormPhone] = useState<string>("");
  const [formPeople, setFormPeople] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successInfo, setSuccessInfo] = useState<{
    course: string;
    date: string;
    name: string;
    phone: string;
    people: number;
    total: number;
  } | null>(null);

  // 상단 토스트 알림 상태
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 남은 좌석 있는 강좌 필터링
  const filteredCourses = courseList.filter((course) => {
    const remainingSeats = course.seat - course.booked;
    if (onlyAvailable) {
      return remainingSeats > 0;
    }
    return true;
  });

  // 날짜 형식 변환 (예: 2026-11-07 -> 2026.11.07 (토))
  const formatDateWithDay = (dateString: string) => {
    try {
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      const dayName = days[date.getDay()];
      return `${dateString.replace(/-/g, ".")} (${dayName})`;
    } catch {
      return dateString;
    }
  };

  // 모달 열기
  const handleOpenModal = (course: Course) => {
    setSelectedCourse(course);
    setFormName("");
    setFormPhone("");
    setFormPeople(1);
    setFormError(null);
    setIsSubmitting(false);
    setIsSuccess(false);
    setSuccessInfo(null);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    if (isSubmitting) return; // 저장 중일 때는 닫기 방지
    setSelectedCourse(null);
    setIsSuccess(false);
    setFormError(null);
  };

  // 예약 폼 제출 핸들러
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    const remainingSeats = selectedCourse.seat - selectedCourse.booked;

    // 유효성 검사 1: 이름 비어있음
    if (!formName.trim()) {
      setFormError("이름을 입력해 주세요.");
      return;
    }

    // 유효성 검사 2: 연락처 비어있음
    if (!formPhone.trim()) {
      setFormError("연락처를 입력해 주세요.");
      return;
    }

    // 유효성 검사 3: 신청 인원 유효성
    const numPeople = Number(formPeople);
    if (!numPeople || numPeople < 1) {
      setFormError("신청 인원은 최소 1명 이상이어야 합니다.");
      return;
    }

    // 유효성 검사 4: 신청 인원이 남은 좌석보다 많은 경우 전송 차단
    if (numPeople > remainingSeats) {
      setFormError(
        `신청 인원(${numPeople}명)이 남은 좌석(${remainingSeats}석)보다 많습니다. 인원을 조정해 주세요.`
      );
      return;
    }

    // 검증 통과 시 에러 초기화 및 제출 상태 시작
    setFormError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reserve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          course: selectedCourse.name,
          name: formName.trim(),
          phone: formPhone.trim(),
          people: numPeople,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "예약 처리 중 오류가 발생했습니다.");
      }

      // 예약 성공 처리
      setIsSuccess(true);
      setSuccessInfo(result.data);
      setToastMessage("예약 신청이 완료되었습니다.");

      // 클라이언트 좌석 데이터 실시간 반영
      setCourseList((prevList) =>
        prevList.map((c) =>
          c.id === selectedCourse.id ? { ...c, booked: c.booked + numPeople } : c
        )
      );

      // 토스트 메시지 4초 후 자동 닫힘
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "예약 신청 중 오류가 발생했습니다.";
      setFormError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c1e] text-slate-100 flex flex-col relative overflow-hidden">
      {/* 배경 장식 글로우 효과 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#1b2a5a]/40 via-[#0d1633]/20 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 상단 알림 토스트 */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-xl bg-amber-400 text-slate-950 font-bold shadow-2xl shadow-amber-500/30 flex items-center gap-3 animate-bounce">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 상단 헤더 */}
      <header className="border-b border-[#1b274c]/70 bg-[#091026]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
              $
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-400">
                스킬투머니
              </h1>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Skill To Money One-Day Masterclass
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/30">
              프리미엄 클래스
            </span>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* 헤더 소개 문구 및 히어로 섹션 */}
        <section className="text-center sm:text-left mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#141e3d] text-amber-300 border border-amber-400/20 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            2026 하반기 얼리버드 수강신청 오픈
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2 sm:mb-3">
            배운 기술이 돈이 되는 원데이 클래스
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            이론만 늘어놓는 강의는 그만! 실무 전문가와 함께 단 하루 만에 실전 기술을 익히고,
            바로 부업과 외주로 연결하는 수익 창출 클래스를 만나보세요.
          </p>
        </section>

        {/* 필터 바 및 체크박스 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#0d1633]/90 border border-[#1d2d5b] mb-8 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#16234b] text-amber-300 border border-amber-400/20">
              클래스 목록
            </span>
            <span className="text-xs sm:text-sm text-slate-400">
              전체 {courseList.length}개 중 <span className="text-amber-400 font-bold">{filteredCourses.length}개</span> 표시
            </span>
          </div>

          {/* "예약 가능한 강좌만 보기" 체크박스 */}
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded-md border-2 border-[#2b3e75] peer-checked:border-amber-400 peer-checked:bg-amber-400 bg-[#091026] transition-all flex items-center justify-center group-hover:border-amber-400/70">
                <svg
                  className="w-3.5 h-3.5 text-slate-950 opacity-0 peer-checked:opacity-100 transition-opacity stroke-[3]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="text-sm font-medium text-slate-200 group-hover:text-amber-300 transition-colors">
              예약 가능한 강좌만 보기
            </span>
          </label>
        </div>

        {/* 강좌 카드 그리드 */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-[#0d1633]/50 border border-[#1b274c]">
            <p className="text-slate-400 text-base mb-2">예약 가능한 강좌가 없습니다.</p>
            <button
              onClick={() => setOnlyAvailable(false)}
              className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
            >
              전체 강좌 보기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {filteredCourses.map((course) => {
              const remainingSeats = course.seat - course.booked;
              const isSoldOut = remainingSeats <= 0;
              const isUrgent = remainingSeats >= 1 && remainingSeats <= 2;
              const isAvailable = remainingSeats > 2;

              return (
                <div
                  key={course.id}
                  className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 border ${
                    isSoldOut
                      ? "bg-[#0b1227]/70 border-slate-800/80 opacity-80"
                      : "bg-gradient-to-b from-[#101c40] to-[#0c142c] border-[#1f3164] hover:border-amber-400/50 hover:shadow-xl hover:shadow-amber-500/10"
                  }`}
                >
                  {/* 상단: 상태 배지 및 날짜 */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                        <svg
                          className="w-4 h-4 text-amber-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{formatDateWithDay(course.date)}</span>
                      </div>

                      {/* 상태 배지 규칙 */}
                      <div>
                        {isSoldOut && (
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            마감
                          </span>
                        )}
                        {isUrgent && (
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse">
                            마감 임박
                          </span>
                        )}
                        {isAvailable && (
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            예약 가능
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 강좌명 */}
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight">
                      {course.name}
                    </h3>

                    {/* 태그 배지들 */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {course.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#16234b] text-amber-200/90 border border-amber-400/20"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 하단: 수강료, 잔여 좌석, 버튼 */}
                  <div className="pt-4 border-t border-[#1a2850]/80 mt-2">
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <span className="text-xs text-slate-400 block mb-0.5">수강료</span>
                        <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                          {course.price.toLocaleString()}
                          <span className="text-base sm:text-lg font-bold text-amber-300/80 ml-1">원</span>
                        </div>
                      </div>

                      {/* 남은 좌석 O석 / 정원 O명 */}
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block mb-0.5">잔여 현황</span>
                        <div className="text-sm font-semibold">
                          <span
                            className={
                              isUrgent
                                ? "text-red-400 font-bold"
                                : isSoldOut
                                ? "text-slate-400"
                                : "text-slate-100"
                            }
                          >
                            남은 좌석 {Math.max(0, remainingSeats)}석
                          </span>
                          <span className="text-slate-400 text-xs font-normal">
                            {" "}
                            / 정원 {course.seat}명
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 좌석 게이지 바 */}
                    <div className="w-full bg-[#152042] h-1.5 rounded-full overflow-hidden mb-5">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isSoldOut
                            ? "bg-slate-600"
                            : isUrgent
                            ? "bg-red-500"
                            : "bg-gradient-to-r from-amber-400 to-yellow-400"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((course.booked / course.seat) * 100)
                          )}%`,
                        }}
                      />
                    </div>

                    {/* 버튼: 마감 시 회색 비활성화, 가능 시 [예약하기] 모달 오픈 */}
                    {isSoldOut ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-3.5 px-4 rounded-xl bg-slate-800/80 text-slate-500 font-bold text-sm cursor-not-allowed border border-slate-700/60 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                        예약 마감
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenModal(course)}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>예약하기</span>
                        <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 예약 신청 팝업 (모달) */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="bg-[#0e1736] border border-[#233568] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
            {/* 상단 헤더: 제목 및 [닫기] (✕) 버튼 */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1b2952] mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {isSuccess ? "수강 신청 완료" : "원데이 클래스 예약 신청"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* 성공 시 안내 화면 */}
            {isSuccess && successInfo ? (
              <div className="py-2 text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div>
                  <h4 className="text-2xl font-black text-amber-300 mb-1">
                    예약 신청이 완료되었습니다
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300">
                    구글 스프레드시트에 예약 정보가 안전하게 저장되었습니다.
                  </p>
                </div>

                {/* 신청 내역 요약 카드 */}
                <div className="bg-[#080d21] rounded-xl p-4 sm:p-5 border border-[#1d2d5b] text-left space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">강좌명</span>
                    <span className="text-white font-bold">{successInfo.course}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">강좌 일정</span>
                    <span className="text-slate-200">{formatDateWithDay(successInfo.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">예약자 성함</span>
                    <span className="text-slate-200">{successInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">연락처</span>
                    <span className="text-slate-200">{successInfo.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">신청 인원</span>
                    <span className="text-slate-200 font-semibold">{successInfo.people}명</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-300 font-semibold">최종 결제 금액</span>
                    <span className="text-amber-400 font-black text-base sm:text-lg">
                      {successInfo.total.toLocaleString()}원
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    확인 및 닫기
                  </button>
                </div>
              </div>
            ) : (
              /* 예약 입력 폼 */
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                {/* 선택된 강좌 정보 (강좌 이름, 날짜 자동 채워짐) */}
                <div className="bg-[#080d21] rounded-xl p-4 border border-[#1b2952] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-300 font-semibold">선택한 강좌</span>
                    <span className="text-xs text-slate-400">
                      남은 좌석:{" "}
                      <span className="text-amber-400 font-bold">
                        {selectedCourse.seat - selectedCourse.booked}석
                      </span>
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white">{selectedCourse.name}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{formatDateWithDay(selectedCourse.date)}</span>
                  </div>
                </div>

                {/* 1. 이름 입력 필드 */}
                <div>
                  <label htmlFor="reserve-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    이름 <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="reserve-name"
                    type="text"
                    required
                    disabled={isSubmitting}
                    placeholder="예: 홍길동"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#091026] border border-[#213261] focus:border-amber-400 focus:outline-none text-white text-sm placeholder:text-slate-500 transition-colors disabled:opacity-50"
                  />
                </div>

                {/* 2. 연락처 입력 필드 */}
                <div>
                  <label htmlFor="reserve-phone" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    연락처 <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="reserve-phone"
                    type="tel"
                    required
                    disabled={isSubmitting}
                    placeholder="예: 010-1234-5678"
                    value={formPhone}
                    onChange={(e) => {
                      setFormPhone(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#091026] border border-[#213261] focus:border-amber-400 focus:outline-none text-white text-sm placeholder:text-slate-500 transition-colors disabled:opacity-50"
                  />
                </div>

                {/* 3. 신청 인원 입력 필드 (숫자) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="reserve-people" className="block text-xs font-semibold text-slate-300">
                      신청 인원 (숫자) <span className="text-red-400">*</span>
                    </label>
                    <span className="text-xs text-slate-400">
                      최대 {selectedCourse.seat - selectedCourse.booked}명 신청 가능
                    </span>
                  </div>
                  <input
                    id="reserve-people"
                    type="number"
                    min={1}
                    max={selectedCourse.seat - selectedCourse.booked}
                    disabled={isSubmitting}
                    value={formPeople}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setFormPeople(isNaN(val) ? 0 : val);
                      if (formError) setFormError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#091026] border border-[#213261] focus:border-amber-400 focus:outline-none text-white text-sm transition-colors disabled:opacity-50"
                  />
                </div>

                {/* 예상 결제 금액 실시간 안내 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#121d3f]/60 border border-[#1e2f60]">
                  <span className="text-xs text-slate-300">예상 결제 금액</span>
                  <div className="text-right">
                    <span className="text-amber-400 font-black text-lg">
                      {((formPeople > 0 ? formPeople : 0) * selectedCourse.price).toLocaleString()}원
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      ({selectedCourse.price.toLocaleString()}원 × {formPeople || 0}명)
                    </span>
                  </div>
                </div>

                {/* 유효성 검사 에러 문구 표시 */}
                {formError && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs flex items-start gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span className="leading-relaxed">{formError}</span>
                  </div>
                )}

                {/* 버튼 영역: [닫기] 및 [신청하기 / 저장 중...] */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    닫기
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>저장 중...</span>
                      </>
                    ) : (
                      <span>신청하기</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 푸터 */}
      <footer className="border-t border-[#141e3d] bg-[#060a17] py-8 text-center text-xs text-slate-400 mt-16">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-300">스킬투머니 (SkillToMoney) | 대표 원데이 수익화 플랫폼</p>
          <p>수강 문의 및 기업 단체 교육: contact@skilltomoney.example.com</p>
          <p className="text-slate-400">© 2026 SkillToMoney. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
