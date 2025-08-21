import { createServerClient } from "@/lib/supabase/server"
import StoriesDirectory from "@/components/stories-directory"

export default async function StoriesPage() {
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

  // Fetch approved stories with user info and categories
  const { data: stories, error: storiesError } = await supabase
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
    .eq("is_approved", true)
    .order("created_at", { ascending: false })

  if (storiesError) {
    console.error("Error fetching stories:", storiesError)
  }

  // Fetch all categories for filtering
  const { data: categories, error: categoriesError } = await supabase
    .from("story_categories")
    .select("*")
    .order("name")

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError)
  }

  // Fetch featured stories
  const { data: featuredStories, error: featuredError } = await supabase
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
    .eq("is_approved", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(3)

  if (featuredError) {
    console.error("Error fetching featured stories:", featuredError)
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <StoriesDirectory 
        stories={stories || []} 
        categories={categories || []} 
        featuredStories={featuredStories || []}
        user={user} 
      />
    </div>
  )
}
