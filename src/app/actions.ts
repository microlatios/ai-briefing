"use server";

import { revalidatePath } from "next/cache";
import { runBriefingJob } from "@/lib/generateBriefing";

export async function generateNowAction(): Promise<void> {
  await runBriefingJob();
  revalidatePath("/");
}
