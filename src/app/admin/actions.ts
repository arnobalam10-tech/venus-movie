"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_CSV_ROWS = 500;
const MIN_PASSWORD_LENGTH = 6;

export interface AddUserState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function addUser(
  _prev: AddUserState,
  formData: FormData,
): Promise<AddUserState> {
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Not authorized." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      status: "error",
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    if (data.user) {
      await supabase
        .from("admin_created_credentials")
        .insert({ user_id: data.user.id, email, password });
    }
  } catch {
    return { status: "error", message: "Admin features aren't configured yet." };
  }

  revalidatePath("/admin");
  return { status: "success", message: `Created account for ${email}.` };
}

export interface CsvRowResult {
  email: string;
  status: "created" | "skipped" | "failed";
  reason?: string;
}

export interface ImportCsvState {
  status: "idle" | "done" | "error";
  message?: string;
  results?: CsvRowResult[];
}

export async function importCsv(
  _prev: ImportCsvState,
  formData: FormData,
): Promise<ImportCsvState> {
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Not authorized." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose a CSV file first." };
  }

  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { status: "error", message: "The CSV file is empty." };
  }

  const first = lines[0].toLowerCase();
  const rows = first.startsWith("email") ? lines.slice(1) : lines;

  if (rows.length === 0) {
    return { status: "error", message: "No data rows found in the CSV." };
  }
  if (rows.length > MAX_CSV_ROWS) {
    return { status: "error", message: `Too many rows (max ${MAX_CSV_ROWS}).` };
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return { status: "error", message: "Admin features aren't configured yet." };
  }

  const results: CsvRowResult[] = [];

  for (const line of rows) {
    const [rawEmail, rawPassword] = line.split(",").map((v) => (v ?? "").trim());

    if (!rawEmail) {
      results.push({ email: line, status: "failed", reason: "Missing email" });
      continue;
    }
    if (!EMAIL_RE.test(rawEmail)) {
      results.push({ email: rawEmail, status: "failed", reason: "Invalid email" });
      continue;
    }
    if (!rawPassword || rawPassword.length < MIN_PASSWORD_LENGTH) {
      results.push({
        email: rawEmail,
        status: "failed",
        reason: `Password too short (min ${MIN_PASSWORD_LENGTH} chars)`,
      });
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: rawEmail,
      password: rawPassword,
      email_confirm: true,
    });

    if (error) {
      const isDuplicate = /already.*registered|already exists/i.test(error.message);
      results.push({
        email: rawEmail,
        status: isDuplicate ? "skipped" : "failed",
        reason: error.message,
      });
    } else {
      if (data.user) {
        await supabase
          .from("admin_created_credentials")
          .insert({ user_id: data.user.id, email: rawEmail, password: rawPassword });
      }
      results.push({ email: rawEmail, status: "created" });
    }
  }

  revalidatePath("/admin");

  const created = results.filter((r) => r.status === "created").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return {
    status: "done",
    message: `${created} created, ${skipped} skipped, ${failed} failed.`,
    results,
  };
}
