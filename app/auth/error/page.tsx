export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="glass-card p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Error</h1>
        <p className="text-muted-foreground mb-6">Something went wrong during sign in. Please try again.</p>
        <a href="/" className="btn-primary">Back to Login</a>
      </div>
    </div>
  )
}
