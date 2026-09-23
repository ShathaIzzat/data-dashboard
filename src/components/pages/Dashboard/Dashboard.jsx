import { useEffect, useMemo, useState } from "react";

import { getExcelData } from "../../../services/excelService";
import { getRecordStatus } from "../../../utils/statusUtils";

import SearchBox from "./../../SearchBox/SearchBox";
import Header from "./../../Header/Header";
import Stats from "./../../Stats/Stats";
import Results from "./../../Results/Results";
import Filters from "./../../Filters/Filters";
import ExportExcel from "./../../ExportExcel/ExportExcel";

import "./Dashboard.css";

// =========================================
// توحيد النص للبحث
// =========================================

function normalizeSearchText(value) {
  return String(value ?? "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ـ]/g, "")
    
    // تحويل الأرقام العربية إلى أرقام إنجليزية
    .replace(/[٠-٩]/g, (digit) => {
      return String(
        "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
      );
    })

    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// =========================================
// تنظيف رقم الهوية
// =========================================

function normalizeIdentity(value) {
  return normalizeSearchText(value)
    .replace(/[\s-]/g, "")
    .replace(/\.0$/, "");
}

// =========================================
// معرفة أعمدة الأسماء
// =========================================

function isNameColumn(columnName) {
  const key = normalizeSearchText(columnName);

  const nameKeywords = [
    "اسم الزوج",
    "اسم الزوجه",
    "اسم الزوجة",
    "اسم الزوج/ة",

    "الزوج",
    "الزوجة",
    "الزوجه",

    "اسم المستفيد",
    "اسم المستفيد/ة",

    "husband name",
    "wife name",
    "husband",
    "wife",
  ];

  return nameKeywords.some((keyword) => {
    const normalizedKeyword =
      normalizeSearchText(keyword);

    return (
      key === normalizedKeyword ||
      key.includes(normalizedKeyword)
    );
  });
}

// =========================================
// معرفة أعمدة الهوية
// =========================================

function isIdentityColumn(columnName) {
  const key = normalizeSearchText(columnName);

  const identityKeywords = [
    // هوية الزوج
    "رقم هوية الزوج",
    "رقم هويه الزوج",
    "هوية الزوج",
    "هويه الزوج",

    // هوية الزوجة
    "رقم هوية الزوجة",
    "رقم هويه الزوجة",
    "رقم هوية الزوجه",
    "رقم هويه الزوجه",
    "هوية الزوجة",
    "هويه الزوجة",
    "هوية الزوجه",
    "هويه الزوجه",

    // هوية عامة
    "رقم الهوية",
    "رقم هويه",
    "الهوية",
    "الهويه",

    // English
    "identity",
    "husband identity",
    "wife identity",
    "husband id",
    "wife id",
  ];

  return identityKeywords.some((keyword) => {
    const normalizedKeyword =
      normalizeSearchText(keyword);

    return (
      key === normalizedKeyword ||
      key.includes(normalizedKeyword)
    );
  });
}

// =========================================
// البحث
//
// الاسم:
// كامل أو جزء من الاسم
//
// الهوية:
// مطابقة كاملة فقط
// =========================================

function matchesSearch(record, searchTerm) {
  const search =
    normalizeSearchText(searchTerm);

  // البحث فارغ
  if (!search) {
    return true;
  }

  const columns = record?.columns || {};

  return Object.entries(columns).some(
    ([columnName, value]) => {
      const normalizedColumn =
        normalizeSearchText(columnName);

      const normalizedValue =
        normalizeSearchText(value);

      if (!normalizedValue) {
        return false;
      }

      // =====================================
      // البحث في اسم الزوج والزوجة
      // يسمح بجزء من الاسم
      // =====================================

      if (isNameColumn(normalizedColumn)) {
        return normalizedValue.includes(search);
      }

      // =====================================
      // البحث في رقم الهوية
      // يجب أن يكون الرقم كاملًا
      // =====================================

      if (isIdentityColumn(normalizedColumn)) {
        const identityValue =
          normalizeIdentity(value);

        const identitySearch =
          normalizeIdentity(searchTerm);

        return (
          identityValue === identitySearch
        );
      }

      return false;
    }
  );
}

// =========================================
// تطبيق جميع الفلاتر
// =========================================

function applyFilters(
  records,
  searchTerm,
  fileFilter,
  sheetFilter,
  statusFilter
) {
  return records.filter((record) => {

    // -----------------------------------------
    // البحث
    // -----------------------------------------

    if (!matchesSearch(record, searchTerm)) {
      return false;
    }

    // -----------------------------------------
    // فلترة الملف
    // -----------------------------------------

    if (
      fileFilter &&
      record.sourceFile !== fileFilter
    ) {
      return false;
    }

    // -----------------------------------------
    // فلترة الورقة
    // -----------------------------------------

    if (
      sheetFilter &&
      record.sheetName !== sheetFilter
    ) {
      return false;
    }

    // -----------------------------------------
    // فلترة الحالة
    // -----------------------------------------

    if (statusFilter) {
      const recordStatus =
        getRecordStatus(record);

      if (
        recordStatus !== statusFilter
      ) {
        return false;
      }
    }

    return true;
  });
}

// =========================================
// Dashboard
// =========================================

function Dashboard() {
  const [data, setData] = useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [fileFilter, setFileFilter] =
    useState("");

  const [sheetFilter, setSheetFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================================
  // تحميل البيانات من السيرفر
  // =========================================

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const result =
          await getExcelData();

        if (!mounted) {
          return;
        }

        setData(
          Array.isArray(result)
            ? result
            : []
        );

      } catch (err) {
        console.error(
          "Dashboard Load Error:",
          err
        );

        if (!mounted) {
          return;
        }

        setError(
          "حدث خطأ أثناء تحميل الكشوفات. تأكدي من تشغيل السيرفر واتصال Google Drive."
        );

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================
  // البيانات بعد تطبيق الفلاتر
  // =========================================

  const filteredData = useMemo(() => {
    return applyFilters(
      data,
      searchTerm,
      fileFilter,
      sheetFilter,
      statusFilter
    );
  }, [
    data,
    searchTerm,
    fileFilter,
    sheetFilter,
    statusFilter,
  ]);

  // =========================================
  // البحث
  // =========================================

  function handleSearch(value) {
    setSearchTerm(value);
  }

  // =========================================
  // فلترة الملف
  // =========================================

  function handleFileFilter(value) {
    setFileFilter(value);

    // إعادة ضبط الورقة
    setSheetFilter("");
  }

  // =========================================
  // فلترة الورقة
  // =========================================

  function handleSheetFilter(value) {
    setSheetFilter(value);
  }

  // =========================================
  // فلترة الحالة
  // =========================================

  function handleStatusFilter(value) {
    setStatusFilter(value);
  }

  // =========================================
  // إعادة ضبط جميع الفلاتر
  // =========================================

  function handleResetFilters() {
    setSearchTerm("");
    setFileFilter("");
    setSheetFilter("");
    setStatusFilter("");
  }

  // =========================================
  // مسح البحث
  // =========================================

  function handleClearSearch() {
    setSearchTerm("");
  }

  // =========================================
  // هل يوجد فلتر فعال؟
  // =========================================

  const hasActiveFilter =
    Boolean(searchTerm) ||
    Boolean(fileFilter) ||
    Boolean(sheetFilter) ||
    Boolean(statusFilter);

  // =========================================
  // Loading
  // =========================================

  if (loading) {
    return (
      <div className="dashboard">

        <Header />

        <main className="dashboard__content">

          <div className="dashboard__loading">

            <div className="dashboard__loader">

              <div className="dashboard__loader-ring"></div>

              <div className="dashboard__loader-icon">
                📊
              </div>

            </div>

            <h3>
              جاري تحميل البيانات
            </h3>

            <p>
              يتم تجهيز الكشوفات وتحميل بيانات المستفيدين...
            </p>

            <div className="dashboard__loading-bar">
              <span></span>
            </div>

          </div>

        </main>

      </div>
    );
  }

  // =========================================
  // Error
  // =========================================

  if (error) {
    return (
      <div className="dashboard">

        <Header />

        <main className="dashboard__content">

          <div className="dashboard__error">

            <div className="dashboard__error-icon">
              ⚠️
            </div>

            <h3>
              تعذر تحميل البيانات
            </h3>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
            >
              إعادة المحاولة
            </button>

          </div>

        </main>

      </div>
    );
  }

  // =========================================
  // الصفحة
  // =========================================

  return (
    <div className="dashboard">

      <Header />

      <main className="dashboard__content">

        {/* =====================================
            البحث
        ====================================== */}

        <section className="dashboard__search-section">

          <SearchBox
            value={searchTerm}
            onSearch={handleSearch}
          />

          {searchTerm && (
            <button
              type="button"
              className="dashboard__clear-search"
              onClick={handleClearSearch}
            >
              ✕ مسح البحث
            </button>
          )}

        </section>

        {/* =====================================
            الفلاتر
        ====================================== */}

        <Filters
          data={data}
          fileFilter={fileFilter}
          sheetFilter={sheetFilter}
          statusFilter={statusFilter}
          onFileChange={handleFileFilter}
          onSheetChange={handleSheetFilter}
          onStatusChange={handleStatusFilter}
          onReset={handleResetFilters}
        />

        {/* =====================================
            الإحصائيات
        ====================================== */}

        <Stats
          data={filteredData}
        />

        {/* =====================================
            النتائج
        ====================================== */}

        {hasActiveFilter ? (

          <Results
            results={filteredData}
          />

        ) : (

          <section className="dashboard__welcome">

            <div className="dashboard__welcome-icon">
              🔎
            </div>

            <h2>
              ابدأ البحث عن المستفيد
            </h2>

            <p>
              استخدم مربع البحث أو الفلاتر للوصول
              إلى البيانات المطلوبة.
            </p>

          </section>

        )}

        {/* =====================================
            التصدير
        ====================================== */}

        <ExportExcel
          data={filteredData}
          statusFilter={statusFilter}
          fileFilter={fileFilter}
          sheetFilter={sheetFilter}
        />

      </main>

    </div>
  );
}

export default Dashboard;