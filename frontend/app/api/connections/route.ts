import { NextResponse, type NextRequest } from "next/server"
import crypto from "node:crypto"
import { createClient } from "@/lib/supabase/server"

const ENCRYPTION_KEY = process.env.POSTFLOW_ENCRYPTION_KEY
  ? Buffer.from(process.env.POSTFLOW_ENCRYPTION_KEY, "hex")
  : null

function encrypt(plain: string): string {
  if (!ENCRYPTION_KEY) return Buffer.from(plain).toString("base64")
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString("base64")
}

function decrypt(data: string): string {
  if (!ENCRYPTION_KEY) return Buffer.from(data, "base64").toString("utf8")
  try {
    const buf = Buffer.from(data, "base64")
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const encrypted = buf.subarray(28)
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
  } catch {
    return ""
  }
}

// GET /api/connections — list all connections for the current user
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("platform_connections")
      .select("id, platform, account_name, account_handle, instance_url, status, connected_at, posts_published")
      .eq("user_id", user.id)
      .order("connected_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ connections: data ?? [] })
  } catch (err) {
    console.error("[api/connections] GET failed:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/connections — create or update a connection
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      platform,
      accountName,
      accountHandle,
      instanceUrl,
      credentials,
    } = body as {
      id?: string
      platform: string
      accountName: string
      accountHandle: string
      instanceUrl?: string
      credentials?: Record<string, string>
    }

    if (!platform || !accountHandle) {
      return NextResponse.json({ error: "platform and accountHandle are required" }, { status: 400 })
    }

    const credentialsEncrypted = credentials && Object.keys(credentials).length > 0
      ? encrypt(JSON.stringify(credentials))
      : null

    const record = {
      user_id:               user.id,
      platform,
      account_name:          accountName || accountHandle,
      account_handle:        accountHandle,
      instance_url:          instanceUrl || null,
      status:                "connected",
      connected_at:          new Date().toISOString(),
      credentials_encrypted: credentialsEncrypted,
      updated_at:            new Date().toISOString(),
    }

    let saved
    if (id) {
      const { data, error } = await supabase
        .from("platform_connections")
        .update(record)
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id, platform, account_name, account_handle, instance_url, status, connected_at, posts_published")
        .single()
      if (error) throw error
      saved = data
    } else {
      const { data, error } = await supabase
        .from("platform_connections")
        .insert({ ...record, posts_published: 0 })
        .select("id, platform, account_name, account_handle, instance_url, status, connected_at, posts_published")
        .single()
      if (error) throw error
      saved = data
    }

    return NextResponse.json({ connection: saved })
  } catch (err) {
    console.error("[api/connections] POST failed:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
