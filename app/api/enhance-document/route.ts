import { createServerClient } from "@/lib/supabase/server"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { content, template, formData } = await request.json()

    if (!content) {
      return new Response("Content is required", { status: 400 })
    }

    // Verify user authentication
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const systemPrompt = `You are a legal document enhancement AI specializing in Indian law. Your role is to improve and refine legal documents while maintaining their legal validity and clarity.

Guidelines for enhancement:
- Improve language clarity and professional tone
- Add relevant legal clauses and protections
- Ensure compliance with Indian legal standards
- Maintain the original structure and intent
- Add appropriate legal disclaimers where needed
- Use proper legal terminology
- Ensure all parties' rights and obligations are clearly defined

Document Type: ${template}
Original Content: ${content}

Please enhance this document by:
1. Improving language and clarity
2. Adding relevant legal protections
3. Ensuring proper legal formatting
4. Including necessary clauses for Indian law compliance
5. Maintaining the original information provided

Return only the enhanced document content without additional commentary.`

    // Use Puter.js AI for response
    const puter = (global as any).puter
    if (!puter?.ai) {
      throw new Error("Puter.js not available on server side")
    }

    const reply = await puter.ai.chat(systemPrompt)

    return new Response(reply.output_text, {
      headers: { "Content-Type": "text/plain" },
    })
  } catch (error) {
    console.error("Error enhancing document:", error)
    return new Response("Failed to enhance document", { status: 500 })
  }
}
