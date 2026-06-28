# Google Apps Script 版本

這個資料夾是月報填報系統的 Google Apps Script 版。

## 功能

- 老師 / 主管登入
- Google Sheets 當資料庫
- 月報填報
- Dashboard
- 本月未送出名單
- 主管審核紀錄
- PDF / Word 匯出到 Google Drive

## 部署方式

1. 到 `script.google.com` 建立新的 Apps Script 專案。
2. 把 `Code.gs`、`Index.html`、`appsscript.json` 內容貼到專案中。
3. 第一次執行後，系統會自動建立 Google Sheets 資料庫。
4. 在 Apps Script 中選擇「部署」→「新增部署作業」→「網頁應用程式」。
5. 設定：
   - 執行身分：`我`
   - 存取權限：依你的校內使用需求設定

## 初始帳號

系統第一次建立資料庫時，會建立 `jack`、`claire`、`ruby`、`crystal`、`sally` 等示範帳號。
請在正式使用前由主管進入「帳號清單與密碼管理」修改帳號、角色與密碼。
示範帳號預設會要求首次登入後修改密碼。

## 注意

- Apps Script 版是雲端 Web App，不是原本的 Node/React 版本。
- `Word` 匯出會先生成 Google 文件與 `.docx` 檔案，`PDF` 也會同步生成到 Drive。
- 如果你之後要接學校帳號驗證，我可以再幫你改成只允許特定 Google Workspace 帳號登入。

## 參考 Dashboard 資料

如果你要沿用既有 Dashboard 的分校 / 老師 / 週資料庫，請先把來源試算表 ID 寫進 Apps Script 的 Script Properties：

- `DASHBOARD_REFERENCE_SPREADSHEET_ID = 你的來源試算表 ID`

設定後，系統會把這些工作表同步成參考資料：

- `weekly_records`
- `weekly_drafts`
- `weekly_classes`
- `admin_monthly`
- `teacher_loads`
- `lead_reason_summary`
- `audit_log`
