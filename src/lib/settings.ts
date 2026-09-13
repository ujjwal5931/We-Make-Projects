import { prisma } from "@/lib/db";

export interface StoreSettingsMap {
  store_name: string;
  contact_email: string;
  support_phone: string;
  currency: string;
  store_description: string;
  max_screenshot_size_mb: string;
}

export async function getStoreSettings(): Promise<StoreSettingsMap> {
  try {
    const settings = await prisma.storeSettings.findMany();
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return {
      store_name: map.store_name || "We Make Projects",
      contact_email: map.contact_email || "support1@wemakeprojects.com",
      support_phone: map.support_phone || "+91 99999999991",
      currency: map.currency || "INR",
      store_description: map.store_description || "Digital engineering resources for students",
      max_screenshot_size_mb: map.max_screenshot_size_mb || "5",
    };
  } catch {
    return {
      store_name: "We Make Projects",
      contact_email: "support1@wemakeprojects.com",
      support_phone: "+91 99999999991",
      currency: "INR",
      store_description: "Digital engineering resources for students",
      max_screenshot_size_mb: "5",
    };
  }
}
