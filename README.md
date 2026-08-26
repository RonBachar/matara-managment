# Matara Management

מערכת ניהול פנימית לסטודיו — לידים, לקוחות, פרויקטים, אפיוני פרויקט ומשימות במקום אחד.
עברית, RTL, משתמש יחיד.

```
ליד → לקוח → פרויקט → אפיון פרויקט
                    + משימות
```

## סטטוס נוכחי — התשתית לא באוויר

הקוד תקין ושני ה־builds עוברים נקי, אבל שתי השכבות שמתחתיו נמחקו:

| שכבה | מצב |
| --- | --- |
| קוד פרונט + שרת | תקין |
| Firebase Auth | פעיל |
| שרת ה־API (היה ב־DigitalOcean) | **נמחק** — `api-matara.ondigitalocean.app` לא קיים |
| בסיס הנתונים (היה ב־Supabase) | **נמחק** — הפרויקט לא קיים, אין גיבוי |

כדי להחזיר את המערכת לאוויר צריך פרויקט Supabase חדש ואחסון חדש לשרת. עד אז המערכת תעלה,
ההתחברות תצליח, וכל המסכים יהיו ריקים.

## מבנה הריפו

- `frontend/` — אפליקציית React (Vite, TypeScript, Tailwind, base-ui/shadcn)
- `backend/` — API של Express + Prisma
- `docs/architecture.md` — הארכיטקטורה, מודל הנתונים והפערים הידועים

## הרצה מקומית

### 1. משתני סביבה

`backend/.env` — ראה `backend/.env.example`:

```env
DATABASE_URL="postgresql://...@...:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://...@...:5432/postgres?sslmode=require"
ALLOWED_ORIGINS=http://localhost:5173
MATARA_WEBHOOK_SECRET=...
MATARA_OWNER_USER_ID=<Firebase UID שלך>
```

`frontend/.env.local` — מפתחות Firebase של הצד לקוח, ו־`VITE_API_URL` ריק בפיתוח
(Vite מפנה `/api` ל־`localhost:3000` דרך proxy).

בנוסף השרת צריך credentials של Firebase Admin: או `backend/firebase-service-account.json`,
או המשתנה `FIREBASE_SERVICE_ACCOUNT_JSON` עם ה־JSON המלא בשורה אחת (מומלץ בפרודקשן).

### 2. מיגרציות

```bash
cd backend && npm run db:migrate
```

### 3. הרצה

```bash
cd backend && npm run dev
```

```bash
cd frontend && npm run dev
```

השרת עולה על `http://localhost:3000`, הפרונט על `http://localhost:5173`.

### לצפייה בנתונים

```bash
cd backend && npm run db:studio
```

## פריסה

הפרונט נפרס ב־Vercel (`frontend/vercel.json` מגדיר SPA rewrites).
לשרת אין כרגע קובץ פריסה בריפו — צריך לכתוב אחד כשמחליטים על ספק אחסון.
