import Link from 'next/link'

interface ProjectCardProps {
  title: string
  description: string
  href: string
  emoji: string
}

export default function ProjectCard({ title, description, href, emoji }: ProjectCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="text-4xl">{emoji}</div>
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <p className="text-gray-500 text-sm flex-1">{description}</p>
      <Link
        href={href}
        className="mt-2 inline-block text-center bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Open project
      </Link>
    </div>
  )
}
