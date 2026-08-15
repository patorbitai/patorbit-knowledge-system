"use strict";

import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import AccountMenu from "@/components/hub/AccountMenu";
import { renderToContainer, click } from "@/components/resume-builder/__tests__/gallery-test-utils";

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { name: "Ada Lovelace", email: "ada@example.com" } },
    status: "authenticated",
  }),
  signOut: vi.fn(),
}));

function menuButton(labelPart: string): HTMLButtonElement | null {
  const menu = document.querySelector('[role="menu"]');
  if (!menu) return null;
  const found = Array.from(menu.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(labelPart),
  );
  return (found as HTMLButtonElement | undefined) ?? null;
}

describe("AccountMenu theme switching", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("shows the user's name, email, theme toggle, and sign out", () => {
    const { unmount } = renderToContainer(
      <ThemeProvider>
        <AccountMenu />
      </ThemeProvider>,
    );
    expect(document.body.textContent).toContain("Ada Lovelace");
    expect(document.body.textContent).toContain("ada@example.com");

    click(document.body.querySelector('button[aria-label="Account menu"]'));
    expect(menuButton("Switch to Light Mode")).toBeTruthy();
    expect(menuButton("Sign out")).toBeTruthy();
    unmount();
  });

  it("dark → light → dark: flips the html class, the label, and persists in localStorage", () => {
    const { unmount } = renderToContainer(
      <ThemeProvider>
        <AccountMenu />
      </ThemeProvider>,
    );

    // Defaults to dark.
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Open the menu and switch to light.
    click(document.body.querySelector('button[aria-label="Account menu"]'));
    click(menuButton("Switch to Light Mode"));

    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("patorbit-theme")).toBe("light");

    // The menu stays open after toggling; the item now says "Switch to Dark Mode".
    expect(menuButton("Switch to Light Mode")).toBeNull();
    click(menuButton("Switch to Dark Mode"));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(localStorage.getItem("patorbit-theme")).toBe("dark");
    unmount();
  });

  it("restores the persisted theme on a fresh mount (refresh / navigation)", () => {
    localStorage.setItem("patorbit-theme", "light");
    const { unmount } = renderToContainer(
      <ThemeProvider>
        <AccountMenu />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains("light")).toBe(true);
    unmount();
  });
});
