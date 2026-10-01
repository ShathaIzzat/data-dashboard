require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const TOKEN_PATH = path.join(
  __dirname,
  "token.json"
);

// ==========================================
// Google OAuth
// ==========================================

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// ==========================================
// تحميل Google Token
// ==========================================

if (fs.existsSync(TOKEN_PATH)) {
  try {
    const tokens = JSON.parse(
      fs.readFileSync(TOKEN_PATH, "utf8")
    );

    oauth2Client.setCredentials(tokens);

    console.log("تم تحميل Google Token ✅");
  } catch (error) {
    console.error(
      "خطأ في قراءة token.json:",
      error.message
    );
  }
} else {
  console.log(
    "لم يتم العثور على token.json ⚠️"
  );

  console.log(
    "افتح http://localhost:5000/auth/google لتسجيل الدخول إلى Google."
  );
}

// ==========================================
// Google Drive
// ==========================================

const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

// ==========================================
// الصفحة الرئيسية
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "Backend يعمل بنجاح ✅",
  });
});

// ==========================================
// Google Login
// ==========================================

app.get("/auth/google", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",

    scope: [
      "https://www.googleapis.com/auth/drive.readonly",
    ],
  });

  res.redirect(authUrl);
});

// ==========================================
// Google Callback
// ==========================================

app.get(
  "/auth/google/callback",
  async (req, res) => {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send(
        "لم يتم استلام رمز Google ❌"
      );
    }

    try {
      const { tokens } =
        await oauth2Client.getToken(code);

      oauth2Client.setCredentials(tokens);

      fs.writeFileSync(
        TOKEN_PATH,
        JSON.stringify(tokens, null, 2)
      );

      console.log(
        "تم حفظ Google Token ✅"
      );

      res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
          <head>
            <meta charset="UTF-8" />
            <title>تم تسجيل الدخول</title>

            <style>
              body {
                font-family: Arial, sans-serif;
                background: #f8fafc;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
              }

              .card {
                background: white;
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                max-width: 500px;
              }

              h1 {
                color: #166534;
              }

              p {
                color: #475569;
                line-height: 1.8;
              }
            </style>
          </head>

          <body>
            <div class="card">
              <h1>
                تم تسجيل الدخول إلى Google بنجاح ✅
              </h1>

              <p>
                تم السماح للتطبيق بالوصول إلى Google Drive.
              </p>

              <p>
                تم حفظ صلاحية الدخول بنجاح.
              </p>

              <p>
                يمكنك إغلاق هذه الصفحة والعودة إلى الموقع.
              </p>
            </div>
          </body>
        </html>
      `);

    } catch (error) {
      console.error(
        "Google OAuth Error:",
        error
      );

      res.status(500).send(`
        <h1>حدث خطأ أثناء تسجيل الدخول إلى Google ❌</h1>
        <p>${error.message}</p>
      `);
    }
  }
);

// ==========================================
// جلب قائمة ملفات Excel
// ==========================================

app.get(
  "/api/drive-files",
  async (req, res) => {
    try {
      const folderId =
        process.env.GOOGLE_DRIVE_FOLDER_ID;

      if (!folderId) {
        return res.status(500).json({
          message:
            "GOOGLE_DRIVE_FOLDER_ID غير موجود في .env",
        });
      }

      const response =
        await drive.files.list({
          q:
            `'${folderId}' in parents and trashed = false`,

          fields:
            "files(id,name,mimeType,size,modifiedTime)",

          orderBy:
            "modifiedTime desc",
        });

      const files =
        response.data.files || [];

      const excelFiles =
        files.filter(
          (file) =>
            file.mimeType ===
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            file.mimeType ===
              "application/vnd.ms-excel"
        );

      res.json({
        message:
          "تم العثور على ملفات Excel ✅",

        count:
          excelFiles.length,

        files:
          excelFiles,
      });

    } catch (error) {
      console.error(
        "Google Drive Error:",
        error
      );

      res.status(500).json({
        message:
          "حدث خطأ أثناء الوصول إلى Google Drive",

        error:
          error.message,
      });
    }
  }
);

// ==========================================
// تحميل جميع ملفات Excel
// ==========================================

app.get(
  "/api/drive-files/download-all",
  async (req, res) => {
    try {
      const folderId =
        process.env.GOOGLE_DRIVE_FOLDER_ID;

      if (!folderId) {
        return res.status(500).json({
          message:
            "GOOGLE_DRIVE_FOLDER_ID غير موجود في .env",
        });
      }

      console.log(
        "البحث عن ملفات Excel..."
      );

      const response =
        await drive.files.list({
          q:
            `'${folderId}' in parents and trashed = false`,

          fields:
            "files(id,name,mimeType,size,modifiedTime)",

          orderBy:
            "modifiedTime desc",
        });

      const files =
        response.data.files || [];

      const excelFiles =
        files.filter(
          (file) =>
            file.mimeType ===
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            file.mimeType ===
              "application/vnd.ms-excel"
        );

      console.log(
        "عدد ملفات Excel:",
        excelFiles.length
      );

      if (excelFiles.length === 0) {
        return res.status(404).json({
          message:
            "لا توجد ملفات Excel في مجلد كشوفات المشروع ❌",
        });
      }

      const results = [];

      for (const file of excelFiles) {
        try {
          console.log(
            "جاري تحميل:",
            file.name
          );

          const fileResponse =
            await drive.files.get(
              {
                fileId: file.id,
                alt: "media",
              },
              {
                responseType: "arraybuffer",
              }
            );

          results.push({
            id: file.id,

            name:
              file.name,

            mimeType:
              file.mimeType,

            modifiedTime:
              file.modifiedTime,

            data:
              Buffer.from(
                fileResponse.data
              ).toString("base64"),
          });

        } catch (fileError) {
          console.error(
            `خطأ في تحميل ${file.name}:`,
            fileError.message
          );
        }
      }

      if (results.length === 0) {
        return res.status(500).json({
          message:
            "تعذر تحميل ملفات Excel من Google Drive ❌",
        });
      }

      console.log(
        "تم تحميل الملفات بنجاح ✅"
      );

      res.json({
        message:
          "تم تحميل جميع كشوفات Excel ✅",

        count:
          results.length,

        files:
          results,
      });

    } catch (error) {
      console.error(
        "Download All Excel Error:",
        error
      );

      res.status(500).json({
        message:
          "حدث خطأ أثناء تحميل كشوفات Excel",

        error:
          error.message,
      });
    }
  }
);

// ==========================================
// حالة السيرفر
// ==========================================

app.get(
  "/api/status",
  (req, res) => {
    res.json({
      server: "online",

      googleDrive: "connected",

      message:
        "السيرفر يعمل بشكل صحيح ✅",
    });
  }
);

// ==========================================
// تشغيل السيرفر
// ==========================================

app.listen(
  PORT,
  () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  }
);