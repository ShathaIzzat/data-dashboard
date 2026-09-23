import { useMemo } from "react";
import "./Filters.css";

function Filters({
  data = [],
  fileFilter = "",
  sheetFilter = "",
  statusFilter = "",
  onFileChange,
  onSheetChange,
  onStatusChange,
  onReset,
}) {
  // =========================================
  // الملفات
  // =========================================

  const files = useMemo(() => {
    return [
      ...new Set(
        data
          .map((record) => record.sourceFile)
          .filter(Boolean)
      ),
    ];
  }, [data]);

  // =========================================
  // الأوراق
  // =========================================

  const sheets = useMemo(() => {
    return [
      ...new Set(
        data
          .filter((record) => {
            if (!fileFilter) {
              return true;
            }

            return record.sourceFile === fileFilter;
          })
          .map((record) => record.sheetName)
          .filter(Boolean)
      ),
    ];
  }, [data, fileFilter]);

  // =========================================
  // العرض
  // =========================================

  return (
    <section className="filters">

      {/* =====================================
          العنوان
      ====================================== */}

      <div className="filters__header">
        <div>
          <h2>تصفية البيانات</h2>

          <p>
            استخدم الفلاتر للوصول إلى البيانات المطلوبة
          </p>
        </div>
      </div>

      {/* =====================================
          الفلاتر
      ====================================== */}

      <div className="filters__grid">

        {/* ===================================
            الملف
        ==================================== */}

        <div className="filters__field">

          <label htmlFor="file-filter">
            الملف
          </label>

          <select
            id="file-filter"
            value={fileFilter}
            onChange={(event) => {
              onFileChange(event.target.value);
            }}
          >
            <option value="">
              جميع الملفات
            </option>

            {files.map((file) => (
              <option
                key={file}
                value={file}
              >
                {file}
              </option>
            ))}
          </select>

        </div>

        {/* ===================================
            الورقة
        ==================================== */}

        <div className="filters__field">

          <label htmlFor="sheet-filter">
            ورقة Excel
          </label>

          <select
            id="sheet-filter"
            value={sheetFilter}
            onChange={(event) => {
              onSheetChange(event.target.value);
            }}
          >
            <option value="">
              جميع الأوراق
            </option>

            {sheets.map((sheet) => (
              <option
                key={sheet}
                value={sheet}
              >
                {sheet}
              </option>
            ))}
          </select>

        </div>

        {/* ===================================
            الحالة
        ==================================== */}

        <div className="filters__field">

          <label htmlFor="status-filter">
            الحالة
          </label>

          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) => {
              onStatusChange(event.target.value);
            }}
          >
            <option value="">
              جميع الحالات
            </option>

            <option value="beneficiary">
              مستفيد
            </option>

            <option value="non-beneficiary">
              غير مستفيد
            </option>

          </select>

        </div>

        {/* ===================================
            إعادة الضبط
        ==================================== */}

        <button
          type="button"
          className="filters__reset"
          onClick={onReset}
        >
          ↻ إعادة ضبط الفلاتر
        </button>

      </div>

    </section>
  );
}

export default Filters;