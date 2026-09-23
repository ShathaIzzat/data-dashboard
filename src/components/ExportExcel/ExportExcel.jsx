import { useState } from "react";
import * as XLSX from "xlsx";

import { getStatusLabel } from "../../utils/statusUtils";

import "./ExportExcel.css";

// =========================================
// Export Excel
// =========================================

function ExportExcel({
  data = [],
  statusFilter = "",
  fileFilter = "",
  sheetFilter = "",
}) {
  const [message, setMessage] = useState("");

  // =========================================
  // تصدير البيانات
  // =========================================

  function handleExport() {
    setMessage("");

    // لا توجد بيانات
    if (!data.length) {
      setMessage(
        "لا توجد بيانات مطابقة للفلاتر الحالية."
      );

      return;
    }

    try {
      // =======================================
      // تجهيز الصفوف
      // =======================================

      const rows = data.map((record) => {
        const row = {};

        Object.entries(record.columns || {}).forEach(
          ([key, value]) => {
            row[key] = value;
          }
        );

        return row;
      });

      // =======================================
      // إنشاء ورقة Excel
      // =======================================

      const worksheet =
        XLSX.utils.json_to_sheet(rows);

      // =======================================
      // ضبط عرض الأعمدة
      // =======================================

      const headers = Object.keys(rows[0] || {});

      worksheet["!cols"] = headers.map((key) => {
        let maxLength = String(key).length;

        rows.forEach((row) => {
          const value = String(
            row[key] ?? ""
          );

          maxLength = Math.max(
            maxLength,
            value.length
          );
        });

        return {
          wch: Math.min(
            Math.max(maxLength + 2, 12),
            40
          ),
        };
      });

      // =======================================
      // إنشاء Workbook
      // =======================================

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "البيانات المفلترة"
      );

      // =======================================
      // اسم الملف
      // =======================================

      let fileName = fileFilter
        ? fileFilter.replace(
            /\.[^/.]+$/,
            ""
          )
        : "كشف النتائج";

      if (sheetFilter) {
        fileName += ` - ${sheetFilter}`;
      }

      if (statusFilter) {
        fileName += ` - ${getStatusLabel(
          statusFilter
        )}`;
      }

      fileName += ".xlsx";

      // =======================================
      // تنزيل الملف
      // =======================================

      XLSX.writeFile(
        workbook,
        fileName
      );

      // =======================================
      // رسالة نجاح
      // =======================================

      setMessage(
        `تم تنزيل الملف بنجاح (${data.length} سجل).`
      );
    } catch (error) {
      console.error(
        "Export Excel Error:",
        error
      );

      setMessage(
        "حدث خطأ أثناء تجهيز ملف Excel."
      );
    }
  }

  // =========================================
  // العرض
  // =========================================

  return (
    <section className="export-excel">

      {/* =====================================
          Header
      ====================================== */}

      <div className="export-excel__header">
        <div>
          <h2>تصدير النتائج</h2>

          <p>
            سيتم تنزيل النتائج الحالية كما تظهر
            بعد تطبيق الفلاتر
          </p>
        </div>
      </div>

      {/* =====================================
          Summary
      ====================================== */}

      <div className="export-excel__summary">

        <div className="export-excel__summary-item">
          <span>عدد السجلات</span>

          <strong>
            {data.length}
          </strong>
        </div>

        <div className="export-excel__summary-item">
          <span>الحالة</span>

          <strong>
            {statusFilter
              ? getStatusLabel(statusFilter)
              : "جميع الحالات"}
          </strong>
        </div>

        <div className="export-excel__summary-item">
          <span>الملف</span>

          <strong>
            {fileFilter || "كل الملفات"}
          </strong>
        </div>

        {sheetFilter && (
          <div className="export-excel__summary-item">
            <span>الورقة</span>

            <strong>
              {sheetFilter}
            </strong>
          </div>
        )}

      </div>

      {/* =====================================
          Button
      ====================================== */}

      <div className="export-excel__actions">

        <button
          type="button"
          className="export-excel__download"
          onClick={handleExport}
          disabled={!data.length}
        >
          📥 تنزيل النتائج كـ Excel
        </button>

      </div>

      {/* =====================================
          Message
      ====================================== */}

      {message && (
        <div className="export-excel__message">
          {message}
        </div>
      )}

    </section>
  );
}

export default ExportExcel;