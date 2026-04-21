'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { label: 'Home', href: '/' },
  { label: 'News Board', href: '/news-board' },
]

export default function NavBar() {
  const pathname = usePathname()
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-2 flex gap-4 overflow-x-auto">
      {links.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className={`text-sm font-medium whitespace-nowrap pb-1 border-b-2 transition-colors ${
            pathname === href
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-blue-600'
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
