import Link from "next/link";
import Logo from "./logo";

export default function Header() {
  return (
    <header className="fixed top-2 z-30 w-full md:top-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-2xl bg-white/80 px-4 shadow-lg backdrop-blur-md border border-gray-200/50">
          {/* Site branding */}
          <div className="flex items-center gap-4">
            <Logo />
          </div>

          {/* Desktop sign in links */}
          <ul className="flex items-center justify-end gap-6">
            <li>
              <Link
                href="/signin"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Connexion
              </Link>
            </li>
            <li>
              <Link
                href="/signup"
                className="btn-sm bg-gray-900 text-white shadow-sm hover:bg-gray-800 px-4 py-2 rounded-lg"
              >
                S'inscrire
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
