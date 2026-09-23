// =========================================
// Status Utilities
// =========================================

export function normalizeStatusText(value) {
  return String(value ?? "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ـ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}


// =========================================
// أسماء الأعمدة التي يمكن أن تعني "الحالة"
// =========================================

const STATUS_COLUMN_KEYWORDS = [
  "الحاله",
  "حالة",
  "حالـة",
  "حاله المستفيد",
  "حالة المستفيد",
  "حالة الاستفاده",
  "حالة الاستفادة",
  "وضع المستفيد",
  "وضع",
  "status",
  "validation",
  "benefit",
  "beneficiary status",
  "beneficiary",
];


// =========================================
// البحث عن عمود الحالة
// =========================================

export function getStatusColumn(columns = {}) {
  const entries = Object.entries(columns);

  if (!entries.length) {
    return null;
  }

  // البحث عن عمود مطابق
  for (const [key] of entries) {
    const normalizedKey = normalizeStatusText(key);

    const found = STATUS_COLUMN_KEYWORDS.some((keyword) => {
      const normalizedKeyword = normalizeStatusText(keyword);

      return (
        normalizedKey === normalizedKeyword ||
        normalizedKey.includes(normalizedKeyword)
      );
    });

    if (found) {
      return key;
    }
  }

  return null;
}


// =========================================
// تحويل قيمة الحالة إلى نوع موحد
// =========================================

export function getRecordStatus(record) {
  const columns = record?.columns || {};

  const statusColumn = getStatusColumn(columns);

  if (!statusColumn) {
    return "";
  }

  const value = normalizeStatusText(columns[statusColumn]);

  if (!value) {
    return "";
  }

  // -------------------------
  // مستفيد
  // -------------------------

  const beneficiaryValues = [
    "مستفيد",
    "مستفيده",
    "مستفيد/ه",
    "beneficiary",
    "beneficiary yes",
    "yes",
    "true",
  ];

  if (
    beneficiaryValues.some(
      (item) => value === normalizeStatusText(item)
    )
  ) {
    return "beneficiary";
  }


  // -------------------------
  // غير مستفيد
  // -------------------------

  const nonBeneficiaryValues = [
    "غير مستفيد",
    "غير مستفيده",
    "غير مستفيد/ه",
    "غيرمستفيد",
    "not beneficiary",
    "notbeneficiary",
    "non beneficiary",
    "non-beneficiary",
    "no",
    "false",
  ];

  if (
    nonBeneficiaryValues.some(
      (item) => value === normalizeStatusText(item)
    )
  ) {
    return "non-beneficiary";
  }


  // -------------------------
  // محاولة إضافية
  // -------------------------

  if (
    value.includes("غير مستفيد") ||
    value.includes("غيرمستفيد") ||
    value.includes("not beneficiary") ||
    value.includes("non beneficiary")
  ) {
    return "non-beneficiary";
  }

  if (
    value.includes("مستفيد") ||
    value.includes("beneficiary")
  ) {
    return "beneficiary";
  }

  return "";
}


// =========================================
// اسم الحالة بالعربي
// =========================================

export function getStatusLabel(status) {
  if (status === "beneficiary") {
    return "مستفيد";
  }

  if (status === "non-beneficiary") {
    return "غير مستفيد";
  }

  return "غير محدد";
}