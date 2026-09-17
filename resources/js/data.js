window.mockData = {
  companies: [
    { id: "a", name: "협력업체 A" },
    { id: "b", name: "협력업체 B" }
  ],
  workers: [
    {
      id: 1,
      name: "홍길동",
      companyId: "a",
      education: "이수",
      questionnaire: "완료",
      lastVisit: "2026.09.15",
      anomaly: "과거 음주 이상 1건",
      signatureType: "모바일 서명",
      signedAt: "2026.09.15 08:18",
      history: [
        { date: "2026.09.15", job: "설비 점검", education: "이수", questionnaire: "완료", bloodPressure: "123/78", alcohol: "미검출", action: "기록 없음", entryStatus: "입문" },
        { date: "2026.08.21", job: "화기 작업", education: "이수", questionnaire: "완료", bloodPressure: "147/92", bloodPressureNeedsReview: true, alcohol: "미검출", action: "재측정 관련 조치 확인 필요", entryStatus: "확인 필요" },
        { date: "2025.11.03", job: "보수 작업", education: "이수", questionnaire: "완료", bloodPressure: "128/82", alcohol: "검출", action: "확인 필요", entryStatus: "출입 보류" }
      ]
    },
    {
      id: 2,
      name: "김철수",
      companyId: "a",
      education: "이수",
      questionnaire: "완료",
      lastVisit: "2026.09.14",
      anomaly: "이상 이력 없음",
      signatureType: "자필 서명 스캔",
      signedAt: "2026.09.14 07:52",
      history: [
        { date: "2026.09.14", job: "전기 작업", education: "이수", questionnaire: "완료", bloodPressure: "119/76", alcohol: "미검출", action: "기록 없음", entryStatus: "입문" },
        { date: "2026.07.02", job: "설비 점검", education: "이수", questionnaire: "완료", bloodPressure: "121/79", alcohol: "미검출", action: "기록 없음", entryStatus: "입문" }
      ]
    },
    {
      id: 3,
      name: "이영희",
      companyId: "b",
      education: "미이수",
      questionnaire: "완료",
      lastVisit: "2026.09.10",
      anomaly: "혈압 재측정 1건",
      signatureType: null,
      signedAt: null,
      history: [
        { date: "2026.09.10", job: "현장 미팅", education: "이수", questionnaire: "완료", bloodPressure: "125/81", alcohol: "미검출", action: "기록 없음", entryStatus: "입문" },
        { date: "2026.06.18", job: "고소 작업", education: "이수", questionnaire: "완료", bloodPressure: "151/96", bloodPressureNeedsReview: true, alcohol: "미검출", action: "재측정 관련 조치 확인 필요", entryStatus: "확인 필요" }
      ]
    }
  ]
};
