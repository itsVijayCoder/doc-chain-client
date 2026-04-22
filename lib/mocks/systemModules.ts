import type { ServerModuleInfo } from "@/modules/types";

// Dev-only mock for GET /api/v1/system/modules. Activated by setting
// NEXT_PUBLIC_USE_MOCK_MODULES=true. Lets the plugin framework be
// tested without a backend running.
//
// MOCK_SYSTEM_MODULES starts empty — by default the flag simulates
// "no modules active". Plugins that want to exercise their UI in
// mock mode extend this array during install. The long-term plan
// is a CLI-managed registration step; for now it's a manual edit
// made once per plugin per dev workstation.

export const USE_MOCK_MODULES =
   process.env.NEXT_PUBLIC_USE_MOCK_MODULES === "true";

export const MOCK_SYSTEM_MODULES: ServerModuleInfo[] = [];
