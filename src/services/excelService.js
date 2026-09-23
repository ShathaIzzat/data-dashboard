import * as XLSX from "xlsx";

// ==================================================
// Backend URL
// ==================================================

const API_URL =
  "http://localhost:5000/api/drive-files/download-all";

// ==================================================
// قراءة جميع ملفات Excel
// ==================================================

export async function getExcelData() {
  try {
    console.log("======================================");
    console.log("جاري تحميل جميع كشوفات Excel...");
    console.log("======================================");

    // ==================================================
    // جلب الملفات من Backend
    // ==================================================

    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(
        `فشل تحميل الكشوفات: ${response.status}`
      );
    }

    const result = await response.json();

    console.log("استجابة السيرفر:", result);

    if (
      !result.files ||
      !Array.isArray(result.files)
    ) {
      throw new Error(
        "لم يتم العثور على ملفات Excel"
      );
    }

    // ==================================================
    // جميع السجلات
    // ==================================================

    const allRecords = [];

    // ==================================================
    // قراءة كل ملف
    // ==================================================

    for (const file of result.files) {
      console.log("");
      console.log("======================================");
      console.log("📁 الملف:", file.name);
      console.log("======================================");

      if (!file.data) {
        console.warn(
          "الملف لا يحتوي على بيانات:",
          file.name
        );

        continue;
      }

      // ==================================================
      // تحويل Base64 إلى Uint8Array
      // ==================================================

      let binaryString;

      try {
        binaryString = atob(file.data);
      } catch (error) {
        console.error(
          "خطأ في فك Base64:",
          file.name,
          error
        );

        continue;
      }

      const bytes = new Uint8Array(
        binaryString.length
      );

      for (
        let i = 0;
        i < binaryString.length;
        i++
      ) {
        bytes[i] =
          binaryString.charCodeAt(i);
      }

      // ==================================================
      // قراءة ملف Excel
      // ==================================================

      let workbook;

      try {
        workbook = XLSX.read(bytes, {
          type: "array",
          cellDates: true,
          raw: false,
        });
      } catch (error) {
        console.error(
          "خطأ في قراءة Excel:",
          file.name,
          error
        );

        continue;
      }

      console.log(
        "📚 الأوراق:",
        workbook.SheetNames
      );

      // ==================================================
      // قراءة جميع الأوراق
      // ==================================================

      for (const sheetName of workbook.SheetNames) {
        console.log("");
        console.log("--------------------------------------");
        console.log("📄 الورقة:", sheetName);
        console.log("--------------------------------------");

        const worksheet =
          workbook.Sheets[sheetName];

        if (!worksheet) {
          console.warn(
            "الورقة غير موجودة:",
            sheetName
          );

          continue;
        }

        // ==================================================
        // تحويل الورقة إلى مصفوفة
        // ==================================================

        const rows =
          XLSX.utils.sheet_to_json(
            worksheet,
            {
              header: 1,
              defval: "",
              raw: false,
              blankrows: false,
            }
          );

        console.log(
          "عدد الصفوف:",
          rows.length
        );

        if (
          !rows ||
          rows.length === 0
        ) {
          console.warn(
            "الورقة فارغة:",
            sheetName
          );

          continue;
        }

        // ==================================================
        // البحث الذكي عن Header
        // ==================================================

        const headerIndex =
          findHeaderRow(rows);

        console.log(
          "🔎 صف العناوين:",
          headerIndex
        );

        // ==================================================
        // إذا لم نجد Header
        // ==================================================

        if (headerIndex === -1) {
          console.warn(
            `لم يتم العثور على Header في ${file.name} - ${sheetName}`
          );

          console.warn(
            "سيتم محاولة استخدام صف مناسب كـ Header."
          );

          const fallbackIndex =
            findFallbackHeaderRow(rows);

          if (fallbackIndex === -1) {
            console.warn(
              "تعذر تحديد Header:",
              file.name,
              sheetName
            );

            continue;
          }

          processSheet(
            rows,
            fallbackIndex,
            file,
            sheetName,
            allRecords
          );

          continue;
        }

        // ==================================================
        // معالجة الورقة
        // ==================================================

        processSheet(
          rows,
          headerIndex,
          file,
          sheetName,
          allRecords
        );
      }
    }

    // ==================================================
    // النتيجة النهائية
    // ==================================================

    console.log("");
    console.log("======================================");

    console.log(
      "✅ إجمالي السجلات:",
      allRecords.length
    );

    console.log(
      "======================================"
    );

    console.log(
      "البيانات النهائية:",
      allRecords
    );

    return allRecords;

  } catch (error) {
    console.error(
      "❌ خطأ في قراءة Excel:",
      error
    );

    throw error;
  }
}

// ==================================================
// معالجة ورقة Excel
// ==================================================

function processSheet(
  rows,
  headerIndex,
  file,
  sheetName,
  allRecords
) {
  // ==================================================
  // Header
  // ==================================================

  const headerRow =
    rows[headerIndex];

  console.log(
    "HEADER ROW الحقيقي:",
    headerRow
  );

  // ==================================================
  // إنشاء أسماء الأعمدة
  // ==================================================

  const headers =
    createHeaders(headerRow);

  console.log(
    "HEADERS النهائية:",
    headers
  );

  // ==================================================
  // البيانات بعد Header
  // ==================================================

  const dataRows =
    rows.slice(headerIndex + 1);

  console.log(
    "عدد صفوف البيانات:",
    dataRows.length
  );

  if (dataRows.length > 0) {
    console.log(
      "أول صف بيانات:",
      dataRows[0]
    );
  }

  // ==================================================
  // قراءة كل صف
  // ==================================================

  for (
    let rowIndex = 0;
    rowIndex < dataRows.length;
    rowIndex++
  ) {
    const row =
      dataRows[rowIndex];

    // ==================================================
    // تجاهل الصفوف الفارغة
    // ==================================================

    if (isEmptyRow(row)) {
      continue;
    }

    const columns = {};

    let hasData = false;

    // ==================================================
    // ربط القيمة باسم العمود
    // ==================================================

    for (
      let colIndex = 0;
      colIndex < headers.length;
      colIndex++
    ) {
      const columnName =
        headers[colIndex];

      if (!columnName) {
        continue;
      }

      const value =
        row[colIndex] ?? "";

      columns[columnName] =
        formatValue(value);

      if (
        String(value).trim() !== ""
      ) {
        hasData = true;
      }
    }

    // ==================================================
    // لا نضيف صفًا فارغًا
    // ==================================================

    if (!hasData) {
      continue;
    }

    // ==================================================
    // إنشاء السجل
    // ==================================================

    const record = {
      id:
        `${file.id}-${sheetName}-${rowIndex}`,

      sourceFile:
        file.name,

      sheetName:
        sheetName,

      columns:
        columns,
    };

    console.log(
      "✅ سجل:",
      record
    );

    allRecords.push(record);
  }
}

// ==================================================
// البحث الذكي عن صف Header
// ==================================================

function findHeaderRow(rows) {
  let bestIndex = -1;
  let bestScore = -Infinity;

  // ==================================================
  // الكلمات العربية والإنجليزية
  // ==================================================

  const keywords = [
    // -----------------------------
    // عربي
    // -----------------------------

    "اسم",
    "الاسم",
    "الأم",
    "الام",
    "الأب",
    "الاب",
    "الزوج",
    "زوج",
    "الزوجة",
    "زوجة",
    "هوية",
    "الهوية",
    "رقم",
    "الجوال",
    "الهاتف",
    "الموبايل",
    "العمر",
    "الحالة",
    "المحافظة",
    "المنطقة",
    "التاريخ",
    "المشروع",
    "التمويل",
    "جهة التمويل",
    "الأسرة",
    "الاسرة",
    "افراد",
    "أفراد",
    "ذكور",
    "إناث",
    "الاناث",
    "الذكور",
    "السكن",
    "الموقع",
    "التوقيع",
    "المرض",
    "المرضي",
    "احتياجات",
    "العنوان",
    "الكمية",
    "المستفيد",
    "الفائدة",

    // -----------------------------
    // English
    // -----------------------------

    "identity",
    "id",
    "name",
    "first",
    "second",
    "third",
    "last",
    "father",
    "mother",
    "husband",
    "wife",
    "mobile",
    "phone",
    "quantity",
    "family",
    "male",
    "female",
    "special",
    "needs",
    "disease",
    "validation",
    "benefit",
    "beneficiary",
    "project",
    "funding",
    "address",
    "area",
    "status",
    "date",
    "location",
    "signature",
  ];

  const maxRows =
    Math.min(rows.length, 50);

  // ==================================================
  // فحص الصفوف الأولى
  // ==================================================

  for (
    let rowIndex = 0;
    rowIndex < maxRows;
    rowIndex++
  ) {
    const row =
      rows[rowIndex];

    if (!Array.isArray(row)) {
      continue;
    }

    // ==================================================
    // الخلايا غير الفارغة
    // ==================================================

    const nonEmptyCells =
      row.filter(
        (cell) =>
          String(
            cell ?? ""
          ).trim() !== ""
      ).length;

    if (nonEmptyCells < 2) {
      continue;
    }

    // ==================================================
    // تجاهل الصفوف التي تبدو كبيانات رقمية
    // ==================================================

    const numericCells =
      row.filter((cell) => {
        const value =
          String(
            cell ?? ""
          ).trim();

        if (!value) {
          return false;
        }

        return isMostlyNumeric(value);
      }).length;

    const textCells =
      row.filter((cell) => {
        const value =
          String(
            cell ?? ""
          ).trim();

        if (!value) {
          return false;
        }

        return !isMostlyNumeric(value);
      }).length;

    // إذا كان الصف معظمه أرقام
    // غالبًا هو صف بيانات
    if (
      numericCells > 0 &&
      numericCells >= textCells &&
      textCells <= 2
    ) {
      continue;
    }

    // ==================================================
    // حساب Keyword Score
    // ==================================================

    let keywordScore = 0;
    let exactKeywordScore = 0;

    for (const cell of row) {
      const value =
        normalizeText(cell);

      if (!value) {
        continue;
      }

      for (const keyword of keywords) {
        const cleanKeyword =
          normalizeText(keyword);

        if (!cleanKeyword) {
          continue;
        }

        // تطابق كامل
        if (value === cleanKeyword) {
          exactKeywordScore += 3;
          keywordScore += 1;
          break;
        }

        // يحتوي على الكلمة
        if (
          value.includes(
            cleanKeyword
          )
        ) {
          keywordScore += 1;
          break;
        }
      }
    }

    // ==================================================
    // تنوع النصوص
    // ==================================================

    let score =
      keywordScore * 3 +
      exactKeywordScore * 2;

    // عدد الأعمدة
    if (nonEmptyCells >= 3) {
      score += 2;
    }

    if (nonEmptyCells >= 5) {
      score += 2;
    }

    if (nonEmptyCells >= 8) {
      score += 3;
    }

    if (nonEmptyCells >= 12) {
      score += 3;
    }

    if (nonEmptyCells >= 16) {
      score += 2;
    }

    // ==================================================
    // الصف الذي يحتوي على نصوص كثيرة
    // ==================================================

    if (textCells >= 3) {
      score += 2;
    }

    if (textCells >= 5) {
      score += 2;
    }

    // ==================================================
    // مقارنة الصف التالي
    // ==================================================

    const nextRow =
      rows[rowIndex + 1];

    if (Array.isArray(nextRow)) {
      const nextNonEmpty =
        nextRow.filter(
          (cell) =>
            String(
              cell ?? ""
            ).trim() !== ""
        ).length;

      // Header عادة يتبعه صف بيانات
      if (
        nextNonEmpty >=
        Math.max(
          2,
          Math.floor(
            nonEmptyCells * 0.4
          )
        )
      ) {
        score += 3;
      }

      // إذا كان الصف التالي يحتوي أرقامًا
      const nextNumeric =
        nextRow.filter((cell) =>
          isMostlyNumeric(
            String(
              cell ?? ""
            ).trim()
          )
        ).length;

      if (
        nextNumeric > 0 &&
        nextNumeric >=
          Math.floor(
            nextNonEmpty * 0.2
          )
      ) {
        score += 2;
      }
    }

    console.log(
      `Header score ROW ${rowIndex}:`,
      {
        keywordScore,
        exactKeywordScore,
        nonEmptyCells,
        numericCells,
        textCells,
        score,
        row,
      }
    );

    // ==================================================
    // اختيار أفضل Header
    // ==================================================

    if (score > bestScore) {
      bestScore = score;
      bestIndex = rowIndex;
    }
  }

  // ==================================================
  // الحد الأدنى المطلوب
  // ==================================================

  if (
    bestIndex === -1 ||
    bestScore < 7
  ) {
    return -1;
  }

  return bestIndex;
}

// ==================================================
// Fallback Header
// ==================================================

function findFallbackHeaderRow(rows) {
  const maxRows =
    Math.min(rows.length, 50);

  let bestIndex = -1;
  let bestScore = -Infinity;

  for (
    let i = 0;
    i < maxRows;
    i++
  ) {
    const row =
      rows[i];

    if (!Array.isArray(row)) {
      continue;
    }

    const values =
      row
        .map((cell) =>
          String(
            cell ?? ""
          ).trim()
        )
        .filter(Boolean);

    if (values.length < 3) {
      continue;
    }

    const numericCount =
      values.filter(
        isMostlyNumeric
      ).length;

    const textCount =
      values.length -
      numericCount;

    // الصف النصي أكثر من الرقمي
    if (
      textCount < 2 ||
      textCount <= numericCount
    ) {
      continue;
    }

    let score =
      values.length * 2 +
      textCount * 2;

    // مقارنة بالصف التالي
    const nextRow =
      rows[i + 1];

    if (Array.isArray(nextRow)) {
      const nextValues =
        nextRow
          .map((cell) =>
            String(
              cell ?? ""
            ).trim()
          )
          .filter(Boolean);

      if (
        nextValues.length >= 2
      ) {
        score += 4;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  if (
    bestIndex !== -1 &&
    bestScore >= 10
  ) {
    return bestIndex;
  }

  return -1;
}

// ==================================================
// إنشاء Headers
// ==================================================

function createHeaders(row) {
  const headers = [];

  if (!Array.isArray(row)) {
    return headers;
  }

  for (
    let index = 0;
    index < row.length;
    index++
  ) {
    let header =
      String(
        row[index] ?? ""
      ).trim();

    // ==================================================
    // Header فارغ
    // ==================================================

    if (!header) {
      header =
        `عمود ${index + 1}`;
    }

    // ==================================================
    // تنظيف المسافات
    // ==================================================

    header =
      header
        .replace(/\s+/g, " ")
        .trim();

    // ==================================================
    // إذا كان Header رقمي بالكامل
    // ==================================================

    if (
      isMostlyNumeric(header)
    ) {
      header =
        `عمود ${index + 1}`;
    }

    // ==================================================
    // معالجة التكرار
    // ==================================================

    let finalHeader =
      header;

    let counter = 1;

    while (
      headers.includes(
        finalHeader
      )
    ) {
      counter++;

      finalHeader =
        `${header} (${counter})`;
    }

    headers.push(
      finalHeader
    );
  }

  return headers;
}

// ==================================================
// فحص الصف الفارغ
// ==================================================

function isEmptyRow(row) {
  if (!Array.isArray(row)) {
    return true;
  }

  return !row.some(
    (cell) =>
      String(
        cell ?? ""
      ).trim() !== ""
  );
}

// ==================================================
// فحص هل القيمة رقمية في الغالب
// ==================================================

function isMostlyNumeric(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return false;
  }

  const text =
    String(value).trim();

  if (!text) {
    return false;
  }

  // إزالة بعض الرموز الشائعة
  const cleaned =
    text
      .replace(/[\s,./\\-]/g, "")
      .replace(/[+()]/g, "");

  if (!cleaned) {
    return false;
  }

  // أرقام عربية أو إنجليزية
  return /^[0-9٠-٩]+$/.test(
    cleaned
  );
}

// ==================================================
// تنظيف النص
// ==================================================

function normalizeText(value) {
  return String(
    value ?? ""
  )
    // إزالة التشكيل العربي
    .replace(
      /[\u064B-\u065F\u0670]/g,
      ""
    )

    // توحيد الألف
    .replace(
      /[أإآ]/g,
      "ا"
    )

    // توحيد الياء
    .replace(
      /ى/g,
      "ي"
    )

    // توحيد التاء المربوطة
    .replace(
      /ة/g,
      "ه"
    )

    // إزالة المسافات الزائدة
    .replace(
      /\s+/g,
      " "
    )

    .trim()
    .toLowerCase();
}

// ==================================================
// تنسيق القيم
// ==================================================

function formatValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  // ==================================================
  // إذا كانت القيمة Date
  // ==================================================

  if (
    value instanceof Date
  ) {
    if (
      isNaN(
        value.getTime()
      )
    ) {
      return "";
    }

    const day =
      String(
        value.getDate()
      ).padStart(
        2,
        "0"
      );

    const month =
      String(
        value.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const year =
      value.getFullYear();

    return `${day}/${month}/${year}`;
  }

  return String(
    value
  ).trim();
}