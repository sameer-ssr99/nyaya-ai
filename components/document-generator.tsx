"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Eye, Loader2, Wand2 } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"

interface DocumentGeneratorProps {
  templateSlug: string
  userId: string
}

interface FormField {
  id: string
  label: string
  type: "text" | "textarea" | "select" | "date" | "number"
  required: boolean
  options?: string[]
  placeholder?: string
}

interface DocumentTemplate {
  id: string
  title: string
  description: string
  category: string
  fields: FormField[]
  template_content: string
}

const sampleTemplate: DocumentTemplate = {
  id: "1",
  title: "Rental Agreement",
  description: "Comprehensive rental agreement for residential properties",
  category: "Property",
  fields: [
    {
      id: "landlord_name",
      label: "Landlord Name",
      type: "text",
      required: true,
      placeholder: "Enter landlord's full name",
    },
    { id: "tenant_name", label: "Tenant Name", type: "text", required: true, placeholder: "Enter tenant's full name" },
    {
      id: "property_address",
      label: "Property Address",
      type: "textarea",
      required: true,
      placeholder: "Enter complete property address",
    },
    {
      id: "monthly_rent",
      label: "Monthly Rent (₹)",
      type: "number",
      required: true,
      placeholder: "Enter monthly rent amount",
    },
    {
      id: "security_deposit",
      label: "Security Deposit (₹)",
      type: "number",
      required: true,
      placeholder: "Enter security deposit amount",
    },
    {
      id: "lease_duration",
      label: "Lease Duration",
      type: "select",
      required: true,
      options: ["6 months", "1 year", "2 years", "3 years"],
    },
    { id: "start_date", label: "Lease Start Date", type: "date", required: true },
    {
      id: "special_terms",
      label: "Special Terms & Conditions",
      type: "textarea",
      required: false,
      placeholder: "Any additional terms or conditions",
    },
  ],
  template_content: `RENTAL AGREEMENT

This Rental Agreement is made on {start_date} between {landlord_name} (Landlord) and {tenant_name} (Tenant) for the property located at {property_address}.

TERMS AND CONDITIONS:

1. RENT: The monthly rent is ₹{monthly_rent}, payable on or before the 5th of each month.

2. SECURITY DEPOSIT: A security deposit of ₹{security_deposit} has been paid by the tenant.

3. LEASE DURATION: This agreement is valid for {lease_duration} starting from {start_date}.

4. SPECIAL TERMS: {special_terms}

5. MAINTENANCE: The tenant shall maintain the property in good condition.

6. TERMINATION: Either party may terminate this agreement with 30 days written notice.

Landlord Signature: _________________    Tenant Signature: _________________
{landlord_name}                         {tenant_name}

Date: _______________                   Date: _______________`,
}

export default function DocumentGenerator({ templateSlug, userId }: DocumentGeneratorProps) {
  const [template, setTemplate] = useState<DocumentTemplate | null>(sampleTemplate)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [generatedContent, setGeneratedContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAIEnhancing, setIsAIEnhancing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    loadTemplate()
  }, [templateSlug])

  const loadTemplate = async () => {
    try {
      console.log("[v0] Loading template for slug:", templateSlug)
      const { data, error } = await supabase.from("document_templates").select("*").eq("slug", templateSlug).single()

      if (error) {
        console.log("[v0] Database error, using fallback template:", error.message)
        setTemplate(sampleTemplate)
        return
      }

      if (data) {
        console.log("[v0] Template loaded from database:", data.title)
        const mappedTemplate: DocumentTemplate = {
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          fields: data.fields,
          template_content: data.template_content,
        }
        setTemplate(mappedTemplate)
      }
    } catch (error) {
      console.log("[v0] Error loading template, using fallback:", error)
      setTemplate(sampleTemplate)
    }
  }

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const generateDocument = () => {
    if (!template) return

    setIsGenerating(true)

    // Replace placeholders with form data
    let content = template.template_content
    template.fields.forEach((field) => {
      const value = formData[field.id] || `[${field.label}]`
      content = content.replace(new RegExp(`{${field.id}}`, "g"), value)
    })

    // Simulate processing time
    setTimeout(() => {
      setGeneratedContent(content)
      setIsGenerating(false)
      setShowPreview(true)
    }, 1500)
  }

  const enhanceWithAI = async () => {
    if (!generatedContent) return

    setIsAIEnhancing(true)

    try {
      const response = await fetch("/api/enhance-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: generatedContent,
          template: template?.title,
          formData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to enhance document")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let enhancedContent = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          enhancedContent += chunk
          setGeneratedContent(enhancedContent)
        }
      }
    } catch (error) {
      console.error("Error enhancing document:", error)
    } finally {
      setIsAIEnhancing(false)
    }
  }

  const saveDocument = async () => {
    if (!generatedContent || !template) return

    try {
      const { data, error } = await supabase
        .from("generated_documents")
        .insert({
          user_id: userId,
          template_id: template.id,
          title: `${template.title} - ${new Date().toLocaleDateString()}`,
          content: generatedContent,
          form_data: formData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      console.log("Document saved successfully")
    } catch (error) {
      console.error("Error saving document:", error)
    }
  }

  const downloadDocument = () => {
    if (!generatedContent) return

    const blob = new Blob([generatedContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${template?.title || "document"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Save to database
    saveDocument()
  }

  if (!template) {
    return <div className="text-center py-12">Loading template...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/documents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{template.title}</h1>
        <p className="text-lg text-gray-600">{template.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
            <CardDescription>Fill in the required information to generate your document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {template.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {field.type === "text" && (
                  <Input
                    id={field.id}
                    type="text"
                    placeholder={field.placeholder}
                    value={formData[field.id] || ""}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    required={field.required}
                  />
                )}

                {field.type === "textarea" && (
                  <Textarea
                    id={field.id}
                    placeholder={field.placeholder}
                    value={formData[field.id] || ""}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    required={field.required}
                    rows={3}
                  />
                )}

                {field.type === "select" && (
                  <Select
                    value={formData[field.id] || ""}
                    onValueChange={(value) => handleInputChange(field.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === "date" && (
                  <Input
                    id={field.id}
                    type="date"
                    value={formData[field.id] || ""}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    required={field.required}
                  />
                )}

                {field.type === "number" && (
                  <Input
                    id={field.id}
                    type="number"
                    placeholder={field.placeholder}
                    value={formData[field.id] || ""}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    required={field.required}
                  />
                )}
              </div>
            ))}

            <div className="flex gap-4 pt-4">
              <Button
                onClick={generateDocument}
                disabled={isGenerating}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Generate Document
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
            <CardDescription>
              {showPreview ? "Review your generated document" : "Fill the form to see preview"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showPreview ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{generatedContent}</pre>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={enhanceWithAI}
                    disabled={isAIEnhancing}
                    variant="outline"
                    className="flex-1 bg-transparent"
                  >
                    {isAIEnhancing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Enhance with AI
                      </>
                    )}
                  </Button>

                  <Button onClick={downloadDocument} className="flex-1 bg-green-500 hover:bg-green-600">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Complete the form and click "Generate Document" to see preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
