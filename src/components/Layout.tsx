import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-blue-950 to-indigo-950 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            {/* Logo Icon */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-glow">
              <span className="text-xl sm:text-2xl">🎭</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white text-shadow">
              Czolko
            </h1>
          </div>
          <p className="text-purple-300/80 text-sm sm:text-base">
            Who Am I? Party Game
          </p>
        </header>

        <main className="animate-fade-in">{children}</main>

        {/* Footer */}
        <footer className="mt-8 sm:mt-12 text-center">
          <p className="text-purple-400/40 text-xs">
            Play with friends • Guess who you are
          </p>
        </footer>
      </div>
    </div>
  );
}
