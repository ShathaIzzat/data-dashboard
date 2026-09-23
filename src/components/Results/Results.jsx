import { useMemo, useState } from "react";
import "./Results.css";

import { getRecordStatus } from "../../utils/statusUtils";

// =========================================
// إعدادات الأقسام
// =========================================

const SECTION_CONFIG = {
  beneficiary: {
    title: "بيانات المستفيد",
    icon: "👤",
  },

  project: {
    title: "بيانات المشروع",
    icon: "📋",
  },

  husband: {
    title: "بيانات الزوج",
    icon: "👨",
  },

  wife: {
    title: "بيانات الزوجة",
    icon: "👩",
  },

  location: {
    title: "بيانات المنطقة",
    icon: "📍",
  },

  other: {
    title: "بيانات أخرى",
    icon: "📄",
  },
};

// ترتيب ظهور الأقسام
const SECTION_ORDER = [
  "beneficiary",
  "project",
  "husband",
  "wife",
  "location",
  "other",
];

// =========================================
// تطبيع النص
// =========================================

function normalizeText(value) {
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
// تنظيف اسم العمود
// =========================================

function cleanColumnName(columnName) {
  return String(columnName ?? "")
    .replace(/\s*\(\d+\)\s*$/, "")
    .trim();
}

// =========================================
// تحديد القسم المناسب لكل عمود
// =========================================

function getSectionForColumn(columnName) {
  const key = normalizeText(cleanColumnName(columnName));

  // -----------------------------------------
  // بيانات المشروع
  // -----------------------------------------

  const projectKeywords = [
    "المشروع",
    "اسم المشروع",
    "جهة التمويل",
    "جهه التمويل",
    "التمويل",
    "الجهة الممولة",
    "جهه مموله",
    "project",
    "funding",
    "funder",
  ];

  if (
    projectKeywords.some(
      (keyword) =>
        key === normalizeText(keyword) ||
        key.includes(normalizeText(keyword))
    )
  ) {
    return "project";
  }

  // -----------------------------------------
  // بيانات الزوجة
  // يجب فحص الزوجة قبل الزوج
  // -----------------------------------------

  const wifeKeywords = [
    "الزوجة",
    "الزوجه",
    "زوجة",
    "زوجه",
    "اسم الزوجة",
    "اسم الزوجه",
    "رقم هوية الزوجة",
    "رقم هويه الزوجة",
    "هوية الزوجة",
    "هويه الزوجة",
    "wife",
  ];

  if (
    wifeKeywords.some(
      (keyword) =>
        key === normalizeText(keyword) ||
        key.includes(normalizeText(keyword))
    )
  ) {
    return "wife";
  }

  // -----------------------------------------
  // بيانات الزوج
  // -----------------------------------------

  const husbandKeywords = [
    "الزوج",
    "زوج",
    "اسم الزوج",
    "رب الاسره",
    "رب الأسرة",
    "رب الاسرة",
    "اسم رب الاسرة",
    "اسم رب الاسره",
    "رقم هوية الزوج",
    "رقم هويه الزوج",
    "هوية الزوج",
    "هويه الزوج",
    "husband",
  ];

  if (
    husbandKeywords.some(
      (keyword) =>
        key === normalizeText(keyword) ||
        key.includes(normalizeText(keyword))
    )
  ) {
    return "husband";
  }

  // -----------------------------------------
  // بيانات المنطقة
  // -----------------------------------------

  const locationKeywords = [
    "المحافظة",
    "المحافظه",
    "محافظة",
    "محافظه",
    "المنطقة",
    "المنطقه",
    "منطقة",
    "منطقه",
    "موقع",
    "موقع السكن",
    "السكن",
    "السكن الحالي",
    "السكن الاصلي",
    "السكن الأصلي",
    "العنوان",
    "الحي",
    "location",
    "district",
    "governorate",
    "address",
  ];

  if (
    locationKeywords.some(
      (keyword) =>
        key === normalizeText(keyword) ||
        key.includes(normalizeText(keyword))
    )
  ) {
    return "location";
  }

  // -----------------------------------------
  // بيانات المستفيد
  // -----------------------------------------

  const beneficiaryKeywords = [
    "المستفيد",
    "اسم المستفيد",
    "اسم المستفيد/ه",
    "رقم الهوية",
    "رقم هويه",
    "الهوية",
    "الهويه",
    "هوية",
    "هويه",
    "رقم الجوال",
    "الجوال",
    "رقم الهاتف",
    "الهاتف",
    "التلفون",
    "عدد افراد الاسره",
    "عدد أفراد الأسرة",
    "عدد الافراد",
    "عدد الأفراد",
    "عدد الذكور",
    "عدد الاناث",
    "عدد الإناث",
    "الجنس",
    "العمر",
    "تاريخ الميلاد",
    "الحالة",
    "الحاله",
    "حالة المستفيد",
    "حاله المستفيد",
    "التاريخ",
    "date",
    "status",
    "identity",
    "mobile",
    "phone",
    "beneficiary",
    "validation",
  ];

  if (
    beneficiaryKeywords.some(
      (keyword) =>
        key === normalizeText(keyword) ||
        key.includes(normalizeText(keyword))
    )
  ) {
    return "beneficiary";
  }

  // -----------------------------------------
  // أي شيء غير معروف
  // -----------------------------------------

  return "other";
}

// =========================================
// تقسيم الأعمدة إلى أقسام
// =========================================

function groupColumns(columns = {}) {
  const groups = {
    beneficiary: [],
    project: [],
    husband: [],
    wife: [],
    location: [],
    other: [],
  };

  Object.entries(columns).forEach(([columnName, value]) => {
    const section = getSectionForColumn(columnName);

    groups[section].push({
      key: columnName,
      value,
    });
  });

  return groups;
}

// =========================================
// تنسيق قيمة الحقل
// =========================================

function formatValue(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "-";
  }

  return String(value);
}

// =========================================
// الحصول على اسم رئيسي للبطاقة
// =========================================

function getMainName(columns = {}) {
  const entries = Object.entries(columns);

  const nameKeywords = [
    "اسم الزوج",
    "اسم الزوجه",
    "اسم الزوجة",
    "اسم المستفيد",
    "اسم رب الاسرة",
    "اسم رب الاسره",
    "husband name",
    "wife name",
    "name",
  ];

  for (const keyword of nameKeywords) {
    const normalizedKeyword = normalizeText(keyword);

    const found = entries.find(([columnName, value]) => {
      const key = normalizeText(columnName);
      const val = formatValue(value);

      return (
        val !== "-" &&
        (key === normalizedKeyword || key.includes(normalizedKeyword))
      );
    });

    if (found) {
      return formatValue(found[1]);
    }
  }

  // إذا لم نجد اسمًا، نأخذ أول قيمة نصية مناسبة
  const fallback = entries.find(([_, value]) => {
    const text = formatValue(value);

    return (
      text !== "-" &&
      text.length > 1 &&
      !/^\d+$/.test(text)
    );
  });

  return fallback ? formatValue(fallback[1]) : "سجل بيانات";
}

// =========================================
// الحصول على الحرف الأول للافتة
// =========================================

function getAvatarLetter(name) {
  const text = String(name ?? "").trim();

  if (!text) {
    return "؟";
  }

  return text.charAt(0);
}

// =========================================
// مكون القسم
// =========================================

function DataSection({ sectionKey, fields }) {
  if (!fields.length) {
    return null;
  }

  const section = SECTION_CONFIG[sectionKey];

  return (
    <div className={`result-section result-section--${sectionKey}`}>
      <div className="result-section__header">
        <div className="result-section__icon">
          {section.icon}
        </div>

        <div className="result-section__title">
          <h4>{section.title}</h4>
          <span>{fields.length} حقل</span>
        </div>
      </div>

      <div className="result-section__grid">
        {fields.map(({ key, value }, index) => (
          <div
            className="result-field"
            key={`${key}-${index}`}
          >
            <span className="result-field__label">
              {cleanColumnName(key)}
            </span>

            <span className="result-field__value">
              {formatValue(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================
// البطاقة الواحدة
// =========================================

function ResultCard({ record }) {
  const [expanded, setExpanded] = useState(false);

  const columns = record?.columns || {};

  const status = getRecordStatus(record);

  const statusLabel =
    status === "beneficiary"
      ? "مستفيد"
      : status === "non-beneficiary"
      ? "غير مستفيد"
      : "غير محدد";

  const statusClass =
    status === "beneficiary"
      ? "beneficiary"
      : status === "non-beneficiary"
      ? "non-beneficiary"
      : "unknown";

  const mainName = getMainName(columns);

  const groupedColumns = useMemo(
    () => groupColumns(columns),
    [columns]
  );

  // -----------------------------------------
  // بعض البيانات المهمة للعرض المختصر
  // -----------------------------------------

  const previewFields = [];

  Object.entries(columns).forEach(([key, value]) => {
    if (previewFields.length >= 4) {
      return;
    }

    const text = formatValue(value);

    if (text === "-") {
      return;
    }

    const section = getSectionForColumn(key);

    if (
      section === "beneficiary" ||
      section === "husband" ||
      section === "wife"
    ) {
      previewFields.push({
        key,
        value,
      });
    }
  });

  // إذا لم نجد 4 حقول مناسبة، نكمل من باقي البيانات
  if (previewFields.length < 4) {
    Object.entries(columns).forEach(([key, value]) => {
      if (previewFields.length >= 4) {
        return;
      }

      const alreadyExists = previewFields.some(
        (item) => item.key === key
      );

      const text = formatValue(value);

      if (!alreadyExists && text !== "-") {
        previewFields.push({
          key,
          value,
        });
      }
    });
  }

  return (
    <article className="result-card">
      {/* =====================================
          رأس البطاقة
      ===================================== */}

      <div className="result-card__header">
        <div className="result-card__person">
          <div className="result-card__avatar">
            {getAvatarLetter(mainName)}
          </div>

          <div className="result-card__person-info">
            <h3>{mainName}</h3>

            <div className="result-card__meta">
              <span>
                📁 {record?.sourceFile || "ملف غير محدد"}
              </span>

              {record?.sheetName && (
                <span>
                  📄 {record.sheetName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          className={`result-card__status result-card__status--${statusClass}`}
        >
          <span className="result-card__status-dot"></span>
          {statusLabel}
        </div>
      </div>

      {/* =====================================
          المعاينة المختصرة
      ===================================== */}

      {!expanded && previewFields.length > 0 && (
        <div className="result-card__preview">
          {previewFields.map(({ key, value }, index) => (
            <div
              className="result-card__preview-item"
              key={`${key}-${index}`}
            >
              <span className="result-card__preview-label">
                {cleanColumnName(key)}
              </span>

              <span className="result-card__preview-value">
                {formatValue(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* =====================================
          التفاصيل الكاملة
      ===================================== */}

      {expanded && (
        <div className="result-card__details">
          {SECTION_ORDER.map((sectionKey) => (
            <DataSection
              key={sectionKey}
              sectionKey={sectionKey}
              fields={groupedColumns[sectionKey]}
            />
          ))}
        </div>
      )}

      {/* =====================================
          زر التفاصيل
      ===================================== */}

      <div className="result-card__footer">
        <button
          type="button"
          className="result-card__details-button"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <span>
            {expanded
              ? "إخفاء التفاصيل"
              : "عرض التفاصيل"}
          </span>

          <span className="result-card__details-arrow">
            {expanded ? "⌃" : "⌄"}
          </span>
        </button>
      </div>
    </article>
  );
}

// =========================================
// المكون الرئيسي
// =========================================

function Results({ results = [] }) {
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 20;

  // -----------------------------------------
  // إجمالي الصفحات
  // -----------------------------------------

  const totalPages = Math.ceil(
    results.length / ITEMS_PER_PAGE
  );

  // -----------------------------------------
  // ضبط الصفحة الحالية إذا تغيرت النتائج
  // -----------------------------------------

  const safeCurrentPage =
    totalPages === 0
      ? 1
      : Math.min(currentPage, totalPages);

  // -----------------------------------------
  // النتائج الحالية
  // -----------------------------------------

  const paginatedResults = useMemo(() => {
    const startIndex =
      (safeCurrentPage - 1) * ITEMS_PER_PAGE;

    const endIndex =
      startIndex + ITEMS_PER_PAGE;

    return results.slice(startIndex, endIndex);
  }, [results, safeCurrentPage]);

  // -----------------------------------------
  // تغيير الصفحة
  // -----------------------------------------

  function goToPage(page) {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // -----------------------------------------
  // أرقام الصفحات
  // -----------------------------------------

  function getPageNumbers() {
    if (totalPages <= 7) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    const pages = [];

    pages.push(1);

    if (safeCurrentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(
      2,
      safeCurrentPage - 1
    );

    const end = Math.min(
      totalPages - 1,
      safeCurrentPage + 1
    );

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    if (safeCurrentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  }

  // -----------------------------------------
  // لا توجد نتائج
  // -----------------------------------------

  if (!results.length) {
    return (
      <section className="results">
        <div className="results__header">
          <div>
            <h2>نتائج البحث</h2>
            <p>البيانات المطابقة للبحث والفلاتر الحالية</p>
          </div>
        </div>

        <div className="results__empty">
          <div className="results__empty-icon">
            🔎
          </div>

          <h3>لا توجد نتائج</h3>

          <p>
            لم يتم العثور على سجلات مطابقة
            للبحث أو الفلاتر الحالية.
          </p>
        </div>
      </section>
    );
  }

  // -----------------------------------------
  // العرض
  // -----------------------------------------

  const startRecord =
    (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;

  const endRecord = Math.min(
    safeCurrentPage * ITEMS_PER_PAGE,
    results.length
  );

  return (
    <section className="results">
      {/* =====================================
          رأس النتائج
      ===================================== */}

      <div className="results__header">
        <div>
          <h2>نتائج البحث</h2>

          <p>
            عرض {startRecord} - {endRecord} من أصل{" "}
            {results.length} سجل
          </p>
        </div>

        <div className="results__count">
          <strong>{results.length}</strong>
          <span>سجل</span>
        </div>
      </div>

      {/* =====================================
          البطاقات
      ===================================== */}

      <div className="results__list">
        {paginatedResults.map((record) => (
          <ResultCard
            key={record.id}
            record={record}
          />
        ))}
      </div>

      {/* =====================================
          الترقيم
      ===================================== */}

      {totalPages > 1 && (
        <div className="results__pagination">
          <button
            type="button"
            className="results__pagination-button"
            onClick={() =>
              goToPage(safeCurrentPage - 1)
            }
            disabled={safeCurrentPage === 1}
          >
            ← السابق
          </button>

          <div className="results__pagination-pages">
            {getPageNumbers().map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`dots-${index}`}
                    className="results__pagination-dots"
                  >
                    …
                  </span>
                );
              }

              return (
                <button
                  type="button"
                  key={page}
                  className={`results__pagination-page ${
                    safeCurrentPage === page
                      ? "active"
                      : ""
                  }`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="results__pagination-button"
            onClick={() =>
              goToPage(safeCurrentPage + 1)
            }
            disabled={
              safeCurrentPage === totalPages
            }
          >
            التالي →
          </button>
        </div>
      )}
    </section>
  );
}

export default Results;