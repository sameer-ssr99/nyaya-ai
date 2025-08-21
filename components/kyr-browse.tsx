"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, BookOpen, Users, Shield, Home, Briefcase, Heart, Scale } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"

interface RightsCategory {
  id: string
  title: string
  description: string
  icon: string
  color: string
  articleCount: number
  slug: string
}

const defaultCategories: RightsCategory[] = [
  {
    id: "1",
    title: "Constitutional Rights",
    description: "Fundamental rights guaranteed by the Indian Constitution",
    icon: "Scale",
    color: "bg-blue-500",
    articleCount: 12,
    slug: "constitutional-rights",
  },
  {
    id: "2",
    title: "Consumer Rights",
    description: "Protection against unfair trade practices and defective goods",
    icon: "Shield",
    color: "bg-green-500",
    articleCount: 8,
    slug: "consumer-rights",
  },
  {
    id: "3",
    title: "Labor Rights",
    description: "Workplace rights, wages, and employment protection",
    icon: "Briefcase",
    color: "bg-orange-500",
    articleCount: 15,
    slug: "labor-rights",
  },
  {
    id: "4",
    title: "Women's Rights",
    description: "Legal protections and rights specific to women",
    icon: "Users",
    color: "bg-purple-500",
    articleCount: 10,
    slug: "womens-rights",
  },
  {
    id: "5",
    title: "Property Rights",
    description: "Land ownership, tenancy, and property disputes",
    icon: "Home",
    color: "bg-red-500",
    articleCount: 9,
    slug: "property-rights",
  },
  {
    id: "6",
    title: "Healthcare Rights",
    description: "Right to healthcare, medical negligence, and patient rights",
    icon: "Heart",
    color: "bg-pink-500",
    articleCount: 7,
    slug: "healthcare-rights",
  },
]

const iconMap = {
  Scale,
  Shield,
  Briefcase,
  Users,
  Home,
  Heart,
  BookOpen,
}

export default function KYRBrowse() {
  const [categories, setCategories] = useState<RightsCategory[]>(defaultCategories)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredCategories, setFilteredCategories] = useState<RightsCategory[]>(defaultCategories)
  const supabase = createBrowserClient()

  useEffect(() => {
    // Load categories from database
    loadCategories()
  }, [])

  useEffect(() => {
    // Filter categories based on search term
    const filtered = categories.filter(
      (category) =>
        category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredCategories(filtered)
  }, [searchTerm, categories])

  const loadCategories = async () => {
    try {
      console.log("[v0] Loading categories from database...")
      const { data, error } = await supabase.from("legal_categories").select("*").order("title")

      if (error) {
        console.log("[v0] Database error, using default categories:", error.message)
        return
      }

      if (data && data.length > 0) {
        console.log("[v0] Loaded categories from database:", data.length)
        const mappedCategories: RightsCategory[] = data.map((cat: any, index: number) => ({
          id: cat.id,
          title: cat.title,
          description: cat.description,
          icon: cat.icon || "BookOpen",
          color: cat.color || `bg-${["blue", "green", "orange", "purple", "red", "pink"][index % 6]}-500`,
          articleCount: 0, // Will be calculated separately
          slug: cat.slug,
        }))
        setCategories(mappedCategories)
      } else {
        console.log("[v0] No categories found in database, using defaults")
      }
    } catch (error) {
      console.log("[v0] Error loading categories, using defaults:", error)
    }
  }

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || BookOpen
    return IconComponent
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search rights categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => {
          const IconComponent = getIcon(category.icon)

          return (
            <Card key={category.id} className="hover:shadow-lg transition-shadow duration-200 group">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-lg ${category.color} text-white group-hover:scale-110 transition-transform duration-200`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {category.articleCount} articles
                  </Badge>
                </div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
                <CardDescription className="text-sm">{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/kyr/${category.slug}`}>
                  <Button className="w-full bg-green-500 hover:bg-green-600">Explore Rights</Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-600">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  )
}
