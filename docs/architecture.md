# Architecture

## חבילה אחת, שני ספקים + Firebase

```
דפדפן  ──►  Vercel
             ├─ dist/          אפליקציית React (Vite)
             └─ api/index.ts   Express (server/app.ts) כפונקציית serverless
                    │  Prisma 5 דרך ה־pooler (pgbouncer)
                    ▼
             PostgreSQL @ Supabase

Firebase Auth — כניסה עם Google, מנפיק ID token לצד לקוח;
firebase-admin בשרת מאמת אותו.
```

`vercel.json` מפנה `/api/(.*)` לפונקציה ואת כל השאר ל־`index.html`.
Express מקבל את ה־URL המקורי, אז הניתובים כתובים עם הקידומת `/api`.
אין CORS — הפרונט וה־API באותו origin גם בפיתוח (Vite proxy) וגם בפרודקשן.

## כניסה — משתמש יחיד

`server/middleware/auth.ts`:

1. `Authorization: Bearer <idToken>` חייב להיות תקין מול Firebase → אחרת 401.
2. ה־`uid` חייב להיות שווה ל־`MATARA_OWNER_USER_ID` → אחרת 403.

בצד לקוח, `src/lib/api.ts` מנתק את המשתמש על 401/403 כדי שחשבון Google זר
יחזור למסך הכניסה במקום לראות טבלאות ריקות.

## מודל הנתונים

```
Client ──1:N──► ClientService   שירות מתחדש (מחזור חיוב, מחיר, תאריך חידוש, תזכורת)
   │
   └──1:N──► Project            סטטוס · סכום כולל · שולם · הערות

   │
   └──1:N──► Quote              הצעת מחיר באתר price-offers · slug ייחודי · נשלחה/נחתמה · פרטי החותם

Lead   עומד בפני עצמו (נכנס מהטופס באתר דרך ה־webhook, או ידנית)
```

- `ClientService` נמחק בקסקייד עם הלקוח. `Project` **לא** — לקוח עם פרויקטים לא ניתן למחיקה, בכוונה.
- `Quote.clientId` אופציונלי (`ON DELETE SET NULL`): הצעה שנחתמה לפני שנרשמה מופיעה ב"הצעות ללא לקוח"
  בעמוד הלקוחות, ומשם משייכים אותה. ה־`slug` (החלק האחרון בכתובת, בלי `.html`) הוא המפתח שמחבר רישום ידני לחתימה.
- `Client.contractUrl` — קישור להסכם החתום (דרייב וכו'). הקובץ עצמו לא נשמר במערכת.
- לכל רשומה יש `userId`. עם הנעילה לבעלים זה תמיד אותו ערך; נשאר כי הוא זול ומאפשר סינון עקבי.

## Webhook

`POST /api/webhooks/leads` — הניתוב היחיד בלי התחברות. מאמת `X-Matara-Webhook-Secret`
ומשייך את הליד ל־`MATARA_OWNER_USER_ID`. מקבל שמות שדות נפוצים
(`name`/`fullName`/`clientName`, `phone`/`tel`, `email`, `source`, `message`/`notes`)
כדי ששינוי בטופס או ב־Make לא יפיל נתונים בשקט.

`POST /api/webhooks/quotes` — נשלח מפרויקט price-offers כשלקוח חותם (`event: "quote.signed"`), עם אותו סוד.
מסמן את ההצעה לפי `quoteSlug` כ"נחתמה" ושומר חותם, תאריך, קישור לחתימה ולעותק החתום (ויוצר אותה אם לא
נרשמה). הצעה בלי לקוח משויכת ללקוח היחיד שהאימייל שלו תואם לחותם; `contractUrl` ריק של הלקוח מתמלא
בעותק החתום. אידמפוטנטי: קריאה חוזרת לא כותבת כלום.

אירועים נכנסים עתידיים (טופס אפיון) יתווספו כניתובים נוספים תחת `/api/webhooks/` עם אותו מנגנון סוד.

## פערים ידועים

- אין קישור בסכימה בין ליד ללקוח שנוצר ממנו.
- אין `GET /api/clients/:id` — עמוד הלקוח מושך את כל הלקוחות ומסנן.
- הודעות שגיאה מהשרת מוצגות כמו שהן; אין retry.
- ESLint: מודלי הטפסים מאפסים state ב־`useEffect` (react-hooks/set-state-in-effect).
