import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import StoryShareForm from "@/components/story-share-form"

export default async function ShareStoryPage() {
  const supabase = await createServerClient()

  // Check if user is authenticated
  let user = null
  try {
    const { data: { user: userData } } = await supabase.auth.getUser()
    user = userData
  } catch (error) {
    console.error("Error getting user:", error)
    // Redirect to login if we can't get user data
    redirect("/auth/login")
  }

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch categories for the form
  const { data: categories, error: categoriesError } = await supabase
    .from("story_categories")
    .select("*")
    .order("name")

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError)
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <StoryShareForm categories={categories || []} user={user} />
    </div>
  )
}
