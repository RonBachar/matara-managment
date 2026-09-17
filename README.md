# Matara Management

מערכת ניהול פנימית לסטודיו — לקוחות, שירותים מתחדשים, פרויקטים ולידים.
עברית, RTL, **משתמש יחיד** (רק חשבון ה־Google של בעל הסטודיו נכנס). לא מיועדת למכירה.

## מבנה

חבילה אחת, deploy אחד (Vercel):

```
src/        אפליקציית React (Vite · TypeScript · Tailwind · base-ui/shadcn)
server/     Express API (Prisma)  — app.ts הוא האפליקציה, local.ts רק לפיתוח
api/        נקודת הכניסה של Vercel: מייצאת את server/app.ts כפונקציה
prisma/     סכימה + מיגרציות
docs/       architecture.md — איך זה עובד ומה הפערים
```

בפרודקשן הפרונט וה־API יושבים באותו דומיין (`/api/*` → הפונקציה), אז אין CORS.

## הרצה מקומית

### 1. משתני סביבה (ראה `.env.example`)

- `.env` — משתני שרת: `DATABASE_URL`, `DIRECT_URL`, `MATARA_OWNER_USER_ID`, `MATARA_WEBHOOK_SECRET`
- `.env.local` — מפתחות Firebase של הצד לקוח (`VITE_FIREBASE_*`)
- `firebase-service-account.json` בשורש (או `FIREBASE_SERVICE_ACCOUNT_JSON` ב־env)

### 2. התקנה ומיגרציות

```bash
npm install
```

```bash
npm run db:migrate
```

### 3. הרצה — שני טרמינלים

```bash
npm run dev:api
```

```bash
npm run dev
```

הפרונט על `http://localhost:5173`, ה־API על `http://localhost:3000` (Vite מפנה `/api` לשם).

### שימושי

```bash
npm run typecheck && npm run lint
```

```bash
npm run db:studio
```

## פריסה ל־Vercel

1. לחבר את הריפו לפרויקט Vercel. Framework: Vite (מזוהה אוטומטית מ־`vercel.json`).
2. Environment Variables: `DATABASE_URL`, `DIRECT_URL`, `MATARA_OWNER_USER_ID`, `MATARA_WEBHOOK_SECRET`,
   `FIREBASE_SERVICE_ACCOUNT_JSON` (ה־JSON בשורה אחת), וכל ה־`VITE_FIREBASE_*`.
3. Domains: להוסיף את הדומיין (למשל `manager.matara.studio`).
4. ב־Firebase Console → Authentication → Settings → Authorized domains: להוסיף את אותו דומיין.
5. להריץ מיגרציות מול בסיס הנתונים החדש פעם אחת מהמחשב: `npm run db:migrate`.

## Webhook לידים

`POST https://<domain>/api/webhooks/leads` עם כותרת `X-Matara-Webhook-Secret`.
מקבל `name`/`clientName`, `phone`, `email`, `source`, `message`/`notes` (וכינויים נפוצים).
