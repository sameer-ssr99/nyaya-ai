"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  Eye, 
  MapPin, 
  Tag, 
  FileText, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

interface StoryShareFormProps {
  categories: any[]
  user: any
}

export default function StoryShareForm({ categories, user }: StoryShareFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    case_type: "",
    location: "",
    outcome: "",
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      // Validate required fields
      if (!formData.title.trim() || !formData.content.trim() || !formData.case_type) {
        throw new Error("Please fill in all required fields")
      }

      // Create the story
      const { data: story, error: storyError } = await supabase
        .from("legal_stories")
        .insert({
          user_id: user.id,
          title: formData.title.trim(),
          content: formData.content.trim(),
          case_type: formData.case_type,
          location: formData.location.trim() || null,
          outcome: formData.outcome.trim() || null,
          is_anonymous: isAnonymous,
          is_approved: false, // Stories need approval
          tags: formData.tags,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (storyError) throw storyError

      setMessage({
        type: "success",
        text: "Your story has been submitted successfully! It will be reviewed and published soon."
      })

      // Reset form
      setFormData({
        title: "",
        content: "",
        case_type: "",
        location: "",
        outcome: "",
        tags: [],
      })
      setTagInput("")

      // Redirect to stories page after 2 seconds
      setTimeout(() => {
        router.push("/stories")
      }, 2000)

    } catch (error) {
      console.error("Error submitting story:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to submit story. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Share Your Legal Story</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Help others by sharing your legal experience. Your story could guide someone facing a similar situation.
            You can choose to remain anonymous or share your identity.
          </p>
        </div>

        {/* Privacy Notice */}
        <Alert className="mb-8">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy & Safety:</strong> Your story will be reviewed before publication. 
            Personal information will be protected, and you can choose to remain anonymous. 
            Stories that violate community guidelines will not be published.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Story Details
            </CardTitle>
            <CardDescription>
              Share your legal experience to help others in similar situations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="anonymous" className="text-base font-medium">
                      Post Anonymously
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Your name will not be displayed with the story
                    </p>
                  </div>
                </div>
                <Switch
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Story Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief, descriptive title for your story"
                  maxLength={100}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.title.length}/100 characters
                </p>
              </div>

              {/* Case Type */}
              <div>
                <Label htmlFor="case_type">Legal Category *</Label>
                <Select
                  value={formData.case_type}
                  onValueChange={(value) => setFormData({ ...formData, case_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select the type of legal case" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content">Your Story *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Share your legal experience in detail. Include what happened, how you handled it, what you learned, and any advice for others..."
                  rows={8}
                  maxLength={2000}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.content.length}/2000 characters
                </p>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location (Optional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, State (e.g., Mumbai, Maharashtra)"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Outcome */}
              <div>
                <Label htmlFor="outcome">Case Outcome (Optional)</Label>
                <Input
                  id="outcome"
                  value={formData.outcome}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                  placeholder="What was the final result? (e.g., Won the case, Settled out of court, etc.)"
                />
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags">Tags (Optional)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add tags to help others find your story"
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    disabled={!tagInput.trim() || formData.tags.length >= 5}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Press Enter or click Add. Maximum 5 tags.
                </p>
                
                {/* Display Tags */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Guidelines */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Story Guidelines:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Be honest and factual in your account</li>
                    <li>• Avoid sharing sensitive personal information</li>
                    <li>• Focus on the legal process and lessons learned</li>
                    <li>• Be respectful and constructive</li>
                    <li>• Do not include names of other parties without permission</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Message */}
              {message && (
                <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  {message.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/stories")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Submitting..." : "Submit Story"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
