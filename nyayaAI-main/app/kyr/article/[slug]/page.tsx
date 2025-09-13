import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import KYRArticleView from "@/components/kyr-article-view"

interface PageProps {
  params: {
    slug: string
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Get user for personalized features
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch article
  const { data: article } = await supabase
    .from("kyr_articles")
    .select(`
      *,
      kyr_categories (
        name,
        color,
        icon,
        slug
      )
    `)
    .eq("slug", params.slug)
    .single()

  if (!article) {
    notFound()
  }

  // Increment view count
  await supabase
    .from("kyr_articles")
    .update({ views: article.views + 1 })
    .eq("id", article.id)

  // Fetch related articles
  const { data: relatedArticles } = await supabase
    .from("kyr_articles")
    .select(`
      *,
      kyr_categories (
        name,
        color,
        icon
      )
    `)
    .eq("category_id", article.kyr_categories.id)
    .neq("id", article.id)
    .limit(3)

  return (
    <div className="min-h-screen bg-background pt-20">
      <KYRArticleView article={article} relatedArticles={relatedArticles || []} user={user} />
    </div>
  )
}
