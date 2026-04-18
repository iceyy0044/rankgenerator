import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { data, error } = await supabase
    .from("favourites")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return new NextResponse(
      JSON.stringify({ message: "Error fetching favourites", error }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  return NextResponse.json(data)
}
