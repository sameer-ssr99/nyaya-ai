import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import StoryView from "@/components/story-view"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function StoryPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerClient()

  // Get user for personalized features
  let user = null
  try {
    const { data: { user: userData } } = await supabase.auth.getUser()
    user = userData
  } catch (error) {
    console.error("Error getting user:", error)
    // Continue without user data
  }

  // Fetch story with user info and categories
  const { data: story } = await supabase
    .from("legal_stories")
    .select(`
      *,
      user_profiles (
        full_name
      ),
      story_category_mapping (
        story_categories (
          name,
          icon,
          color
        )
      )
    `)
    .eq("id", id)
    .eq("is_approved", true)
    .single()

  if (!story) {
    notFound()
  }

  // Increment view count
  await supabase
    .from("legal_stories")
    .update({ view_count: story.view_count + 1 })
    .eq("id", id)

  // Fetch comments
  const { data: comments } = await supabase
    .from("story_comments")
    .select(`
      *,
      user_profiles (
        full_name
      )
    `)
    .eq("story_id", id)
    .eq("is_approved", true)
    .order("created_at", { ascending: true })

  // Check if user has liked the story
  let userLiked = false
  if (user) {
    const { data: like } = await supabase
      .from("story_likes")
      .select("id")
      .eq("story_id", id)
      .eq("user_id", user.id)
      .single()
    userLiked = !!like
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <StoryView 
        story={story} 
        comments={comments || []} 
        user={user} 
        userLiked={userLiked}
      />
    </div>
  )
}
