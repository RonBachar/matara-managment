import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">הדף לא נמצא</h2>
      <p className="text-sm text-muted-foreground">
        נראה שהכתובת אינה קיימת.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted"
      >
        חזרה לדשבורד
      </Link>
    </section>
  )
}

