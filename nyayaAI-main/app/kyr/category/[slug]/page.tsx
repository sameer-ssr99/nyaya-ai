import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import KYRCategoryView from "@/components/kyr-category-view"

interface PageProps {
  params: {
    slug: string
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Get user for personalized features
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch category
  const { data: category } = await supabase.from("kyr_categories").select("*").eq("slug", params.slug).single()

  if (!category) {
    notFound()
  }

  // Fetch articles in this category
  const { data: articles } = await supabase
    .from("kyr_articles")
    .select(`
      *,
      kyr_categories (
        name,
        color,
        icon
      )
    `)
    .eq("category_id", category.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background pt-20">
      <KYRCategoryView category={category} articles={articles || []} user={user} />
    </div>
  )
}
