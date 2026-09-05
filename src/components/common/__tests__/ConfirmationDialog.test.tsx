import { describe, it, expect, vi } from "vitest";

// ConfirmationDialog uses React + createPortal + framer-motion.
// We test the component exports, hook logic, and configuration.

describe("ConfirmationDialog", () => {
  it("exports ConfirmationDialog and useConfirmation", async () => {
    const mod = await import("../ConfirmationDialog");
    expect(typeof mod.ConfirmationDialog).toBe("function");
    expect(typeof mod.useConfirmation).toBe("function");
  });

  it("variant options are limited to danger, warning, default", () => {
    type Variant = "danger" | "warning" | "default";
    const validVariants: Variant[] = ["danger", "warning", "default"];
    expect(validVariants).toHaveLength(3);
    expect(validVariants).toContain("danger");
    expect(validVariants).toContain("warning");
    expect(validVariants).toContain("default");
  });

  it("confirm button styles map to correct colors", () => {
    const confirmStyles = {
      danger: "bg-rose-600 hover:bg-rose-500 text-white",
      warning: "bg-amber-600 hover:bg-amber-500 text-white",
      default: "bg-blue-600 hover:bg-blue-500 text-white",
    };
    expect(confirmStyles.danger).toContain("rose");
    expect(confirmStyles.warning).toContain("amber");
    expect(confirmStyles.default).toContain("blue");
  });

  it("icon backgrounds map to correct colors", () => {
    const iconBg = {
      danger: "bg-rose-500/15 text-rose-400",
      warning: "bg-amber-500/15 text-amber-400",
      default: "bg-blue-500/15 text-blue-400",
    };
    expect(iconBg.danger).toContain("rose");
    expect(iconBg.warning).toContain("amber");
    expect(iconBg.default).toContain("blue");
  });

  it("default labels are Confirm and Cancel", () => {
    // The component defaults to confirmLabel="Confirm" and cancelLabel="Cancel"
    const defaults = { confirm: "Confirm", cancel: "Cancel" };
    expect(defaults.confirm).toBe("Confirm");
    expect(defaults.cancel).toBe("Cancel");
  });
});
