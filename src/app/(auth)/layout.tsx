export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">
      {children}
    </div>
  )
}
