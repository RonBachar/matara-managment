type AppHeaderProps = {
  title: string
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-14 items-center px-6">
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>
    </header>
  )
}

