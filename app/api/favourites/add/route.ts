import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const favourite = await request.json()

  const { data, error } = await supabase
    .from("favourites")
    .insert({ ...favourite, user_id: user.id })
    .select()
    .single()

  if (error) {
    return new NextResponse(
      JSON.stringify({ message: "Error saving favourite", error }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  return NextResponse.json(data)
}
