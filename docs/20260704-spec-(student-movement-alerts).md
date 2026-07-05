# 未來兩週學生異動提醒規格

## 目的

- 在主管打開 Dashboard 時，直接看到從今天起 14 天內需要追蹤的學生異動。
- 優先涵蓋：插班、進班、轉入、轉出、流失、試讀。
- 將沒有明確日期、但已標記 `待轉入 / 待轉出 / 待流失 / 待插班` 的學生，另外列成待確認清單。

## 本次資料來源

- Google Drive `20260702-主資料表-(dashboard-master)` 的 `09_SourceMap`
- `operations` 對應試算表：`二重分校 Dashboard 資料庫`
- 試算表 ID：`1XmOjAzSvXLcxrF6cu4akq3rnaKe2teHRDG1cvIkWB_o`
- 主要工作表：`weekly_classes`
- 本次快照來源週次：`2026-06-29 ~ 2026-07-03`
- 來源最後更新時間：`2026-07-02 22:43:50 +08:00`

## 抽取規則

1. 以 `weekly_classes.note` 作為主要事件來源。
2. 解析 note 內的 `學生名 + 日期 + 動作` 組合。
3. 動作正規化：
   - `插班`、`進班` -> `insert`
   - `轉入` -> `transfer_in`
   - `轉出`、`轉班` -> `transfer_out`
   - `流失`、`已流失` -> `loss`
   - `試讀` -> `trial`
4. 若 note 出現 `待`，事件狀態標為 `pending`；否則為 `confirmed`。
5. 視窗定義為「台北時間今天起算 14 天內」，含今天與第 14 天。
6. 沒有明確日期、但屬於 `pending` 的事件，不進主提醒清單，改進 `待排日期` 區塊。

## 前端顯示需求

- Dashboard 上方新增 `未來兩週學生異動提醒` 面板。
- 面板至少顯示：
  - 期間範圍
  - 來源資料更新時間
  - 總事件數
  - 依類型分組的計數
  - 逐筆提醒清單
  - `待排日期` 清單
- 主管登入後預設進入 Dashboard，避免還要切頁才看到提醒。

## API / 資料欄位

### `BootstrapData.studentMovementDigest`

- `windowStart`: 視窗起日，`YYYY-MM-DD`
- `windowEnd`: 視窗迄日，`YYYY-MM-DD`
- `generatedAt`: 伺服器產生時間
- `source`: 來源資訊
  - `spreadsheetId`
  - `spreadsheetTitle`
  - `spreadsheetUrl`
  - `sheetName`
  - `snapshotRecordId`
  - `snapshotWeekStart`
  - `snapshotWeekEnd`
  - `sourceUpdatedAt`
  - `capturedAt`
  - `notes`
  - `rowCount`
- `summary`: 摘要資訊
  - `totalUpcoming`
  - `totalPendingWithoutDate`
  - `insertCount`
  - `transferInCount`
  - `transferOutCount`
  - `lossCount`
  - `trialCount`
- `upcoming[]`: 14 天內的已排定 / 待確認事件
  - `id`
  - `studentName`
  - `movementType`
  - `movementLabel`
  - `rawActionLabel`
  - `status`
  - `statusLabel`
  - `eventDate`
  - `eventDateLabel`
  - `daysUntil`
  - `className`
  - `sourceRow`
  - `sourceNote`
  - `sourceWeekStart`
  - `sourceWeekEnd`
  - `sourceUpdatedAt`
- `undatedPending[]`: 沒有明確日期的待確認事件
  - 與 `upcoming[]` 欄位相同，但 `eventDate = null`
