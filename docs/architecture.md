# Architecture

## שלוש שכבות

```
דפדפן (Vercel SPA)
  React 19 · Vite · TypeScript · Tailwind 4 · base-ui/shadcn · RTL
  Firebase Auth — כניסה עם Google, מחזיר ID token
      │  fetch עם  Authorization: Bearer <idToken>
      ▼
Express API
  requireAuth → firebase-admin.verifyIdToken → req.userId
  ניתובים: projects · clients · client-services · leads · tasks · project-briefs
  + webhook ציבורי:  POST /api/webhooks/leads  (אימות בכותרת X-Matara-Webhook-Secret)
      │  Prisma 5
      ▼
PostgreSQL (Supabase — pooler למצב runtime, DIRECT_URL למיגרציות)
```

הפרונט לא ניגש לבסיס הנתונים ישירות. השרת הוא המקור היחיד לאמת.

## מודל הנתונים

```
Client ──1:N──> ClientService     שירות מתחדש (מחזור חיוב, מחיר, תאריך חידוש, תזכורת)
   │
   └──1:N──> Project ──1:1──> ProjectBrief    שאלון אפיון, נשמר כשדה JSON יחיד

Lead      עומד בפני עצמו
Task      עומדת בפני עצמה
```

מחיקות: `ClientService` ו־`ProjectBrief` נמחקים בקסקייד עם ההורה שלהם.
`Project` **לא** נמחק בקסקייד עם `Client` — לקוח עם פרויקטים לא ניתן למחיקה, וזה מכוון.

## בעלות על נתונים

לכל רשומה ב־`Client`, `Project`, `ProjectBrief`, `Lead` ו־`Task` יש שדה `userId`
שהוא ה־UID של חשבון הגוגל שהתחבר. כל שאילתה בשרת מסננת לפיו.
`ClientService` יורש בעלות דרך ה־`Client` שלו.

המערכת מיועדת למשתמש אחד אבל בנויה טכנית כרב־משתמשית.

## כללי מוצר שנאכפים בקוד

- לכל פרויקט יש **אפיון אחד לכל היותר** (`ProjectBrief.projectId` מסומן `@unique`).
- האפיון נפתח מתוך עמוד הפרויקט. אם קיים — במצב עריכה, אם לא — במצב יצירה.
- שורת אפיון נוצרת בבסיס הנתונים **רק בשמירה הראשונה**, לא בלחיצה על "צור אפיון".
- שדות האפיון נשמרים כ־JSON בעמודת `data`, לא כעמודות נפרדות — כדי שאפשר יהיה לשנות
  את השאלון בלי מיגרציה.

## Webhook הלידים

`POST /api/webhooks/leads` הוא הניתוב היחיד שלא דורש התחברות. הוא מאמת סוד קבוע
בכותרת `X-Matara-Webhook-Secret`, ומשייך את הליד שנוצר ל־`MATARA_OWNER_USER_ID`.
משמש טפסים באתרים חיצוניים.

## פערים ידועים

- **אין קישור בין ליד ללקוח.** המסלול `ליד → לקוח` הוא נוהל עבודה, לא יחס בסכימה.
- **אין קישור בין משימה לפרויקט.** משימות עומדות בפני עצמן.
- **קבצי הסכמים נשמרים ב־IndexedDB של הדפדפן בלבד.** בבסיס הנתונים נשמרים רק
  מזהה, שם וסוג הקובץ — הקובץ עצמו לא זמין מדפדפן אחר.
- **אין רשימת מורשים בהתחברות.** השרת מאמת שה־token תקין אבל לא בודק של מי הוא.
- **אין הודעות שגיאה בממשק.** כשקריאה לשרת נכשלת, המסך פשוט נשאר ריק.
- **אין `GET /api/projects/:id`.** הפרונט מושך את כל הפרויקטים ומסנן בזיכרון.
