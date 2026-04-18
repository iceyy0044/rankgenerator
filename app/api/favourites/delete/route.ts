import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
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

  const { id } = await request.json()

  const { error } = await supabase
    .from("favourites")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return new NextResponse(
      JSON.stringify({ message: "Error deleting favourite", error }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  return new NextResponse(null, { status: 204 })
}
