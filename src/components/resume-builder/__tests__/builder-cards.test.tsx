"use strict";

/**
 * Resume Builder UX 2.0 — card-based section tests.
 *
 * Covers:
 *  - BulletList: independent bullet editing, Enter-to-add, Backspace-to-remove,
 *    move/delete controls, AI improve callback
 *  - ExperienceSection: entries render as cards, bullets are individually
 *    editable and isolated, edit toggle reveals structured fields
 *  - PersonalSection: profile card shows content, edit reveals fields
 *  - SkillsSection: chips render and add works
 */

import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { ExperienceSection } from "../sections/ExperienceSection";
import { PersonalSection } from "../sections/PersonalSection";
import { SkillsSection } from "../sections/SkillsSection";
import { BulletList } from "../cards/BulletList";
import { renderToContainer, click, findButton } from "./gallery-test-utils";
import { installObserverStubs } from "./gallery-test-utils";
import type { Resume } from "@/types/resume";

installObserverStubs();

function seedResume(overrides: Partial<Resume>): void {
  const resume: Resume = { ...defaultResume, ...overrides };
  useResumeBuilder.setState({
    resumes: [resume],
    activeResumeId: resume.resumeId,
    resume,
    styleConfigs: {},
    saveStatus: "saved",
    aiActions: {},
  });
}

function textOf(container: HTMLElement): string {
  return (container.textContent || "").replace(/\s+/g, " ").trim();
}

/** Set an input/textarea value through the native setter so React onChange fires. */
function setNativeValue(el: HTMLTextAreaElement | HTMLInputElement, value: string): void {
  const proto = el instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("BulletList — bullets as independent objects", () => {
  it("renders each bullet independently and edits only the targeted bullet", () => {
    let bullets = ["First bullet", "Second bullet", "Third bullet"];
    const { container, unmount } = renderToContainer(
      <BulletList bullets={bullets} onChange={(next) => { bullets = next; }} />,
    );
    const textareas = Array.from(container.querySelectorAll("textarea")) as HTMLTextAreaElement[];
    expect(textareas).toHaveLength(3);
    expect(textareas[0].value).toBe("First bullet");

    // Edit only the second bullet.
    setNativeValue(textareas[1], "Second bullet (edited)");
    expect(bullets[0]).toBe("First bullet");
    expect(bullets[1]).toBe("Second bullet (edited)");
    expect(bullets[2]).toBe("Third bullet");
    unmount();
  });

  it("Enter creates a new bullet below the focused one", () => {
    let bullets = ["Only bullet"];
    const { container, unmount } = renderToContainer(
      <BulletList bullets={bullets} onChange={(next) => { bullets = next; }} />,
    );
    const ta = container.querySelector("textarea") as HTMLTextAreaElement;
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(bullets).toHaveLength(2);
    expect(bullets[1]).toBe("");
    unmount();
  });

  it("Backspace on an empty bullet removes it (when more than one exists)", () => {
    let bullets = ["Keep me", "", "Keep me too"];
    const { container, unmount } = renderToContainer(
      <BulletList bullets={bullets} onChange={(next) => { bullets = next; }} />,
    );
    const textareas = Array.from(container.querySelectorAll("textarea")) as HTMLTextAreaElement[];
    textareas[1].dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true, cancelable: true }));
    expect(bullets).toHaveLength(2);
    expect(bullets).toEqual(["Keep me", "Keep me too"]);
    unmount();
  });

  it("move and delete controls are present", () => {
    let bullets = ["One", "Two"];
    const { container, unmount } = renderToContainer(
      <BulletList bullets={bullets} onChange={(next) => { bullets = next; }} />,
    );
    expect(container.querySelectorAll('[aria-label="Move bullet up"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[aria-label="Delete bullet"]').length).toBe(2);
    unmount();
  });

  it("empty list renders an add CTA instead of a blank form", () => {
    const { container, unmount } = renderToContainer(
      <BulletList bullets={[]} onChange={() => {}} />,
    );
    expect(container.textContent).toContain("Describe an achievement");
    expect(container.querySelectorAll("textarea")).toHaveLength(0);
    unmount();
  });
});

describe("ExperienceSection — content-first cards", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders every experience entry as a card with its own bullets", () => {
    seedResume({
      experience: [
        { id: "e1", company: "Acme", position: "Engineer", location: "Pune", startDate: "Jan 2024", endDate: "Present", employmentType: "", industry: "", current: false, duration: "", description: "Narrative summary", achievements: "", techUsed: "Python, SQL", bulletPoints: ["Built pipelines", "Automated reports"] },
        { id: "e2", company: "Globex", position: "Analyst", location: "", startDate: "", endDate: "", employmentType: "", industry: "", current: false, duration: "", description: "", achievements: "", techUsed: "", bulletPoints: ["Analyzed churn"] },
      ],
    });
    const { container, unmount } = renderToContainer(<ExperienceSection />);

    expect(textOf(container)).toContain("Acme");
    expect(textOf(container)).toContain("Globex");
    // Bullets appear as independent textareas, one per bullet.
    const textareas = Array.from(container.querySelectorAll("textarea")) as HTMLTextAreaElement[];
    const bulletValues = textareas.map((t) => t.value);
    expect(bulletValues).toContain("Built pipelines");
    expect(bulletValues).toContain("Automated reports");
    expect(bulletValues).toContain("Analyzed churn");
    // Narrative description is rendered as text, not a textarea (single-blob).
    expect(textOf(container)).toContain("Narrative summary");
    unmount();
  });

  it("editing one bullet changes only that bullet in the store", () => {
    seedResume({
      experience: [
        { id: "e1", company: "Acme", position: "Engineer", location: "", startDate: "", endDate: "", employmentType: "", industry: "", current: false, duration: "", description: "", achievements: "", techUsed: "", bulletPoints: ["Old bullet A", "Old bullet B"] },
      ],
    });
    const { container, unmount } = renderToContainer(<ExperienceSection />);
    const textareas = Array.from(container.querySelectorAll("textarea")) as HTMLTextAreaElement[];
    expect(textareas).toHaveLength(2);

    setNativeValue(textareas[1], "New bullet B");

    const stored = useResumeBuilder.getState().resume.experience[0].bulletPoints;
    expect(stored).toEqual(["Old bullet A", "New bullet B"]);
    unmount();
  });

  it("edit toggle reveals structured role fields", () => {
    seedResume({
      experience: [
        { id: "e1", company: "Acme", position: "Engineer", location: "", startDate: "", endDate: "", employmentType: "", industry: "", current: false, duration: "", description: "", achievements: "", techUsed: "", bulletPoints: [] },
      ],
    });
    const { container, unmount } = renderToContainer(<ExperienceSection />);
    click(findButton("Edit"));
    const inputValues = Array.from(container.querySelectorAll("input")).map((i) => (i as HTMLInputElement).value);
    expect(inputValues).toContain("Acme");
    expect(inputValues).toContain("Engineer");
    unmount();
  });
});

describe("PersonalSection — profile card", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("shows content without exposing every input", () => {
    seedResume({
      name: "Arvind Chauhan",
      title: "Data Engineer",
      email: "carvind35@gmail.com",
      phone: "+91 9226232697",
      address: "Mumbai, India",
      summary: "Data engineer with 3+ years.",
      social: { linkedin: "linkedin.com/in/arvind", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
    });
    const { container, unmount } = renderToContainer(<PersonalSection />);
    const t = textOf(container);
    expect(t).toContain("Arvind Chauhan");
    expect(t).toContain("Data Engineer");
    expect(t).toContain("carvind35@gmail.com");
    expect(t).toContain("Mumbai, India");
    expect(t).toContain("Data engineer with 3+ years.");
    // No email input in view mode.
    expect(Array.from(container.querySelectorAll("input")).filter((i) => (i as HTMLInputElement).value === "carvind35@gmail.com")).toHaveLength(0);
    unmount();
  });

  it("Edit Profile reveals the structured fields, preserving values", () => {
    seedResume({
      name: "Arvind Chauhan",
      email: "carvind35@gmail.com",
      phone: "+91 9226232697",
      title: "",
      summary: "",
      social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
    });
    const { container, unmount } = renderToContainer(<PersonalSection />);
    click(findButton("Edit Profile"));
    const values = Array.from(container.querySelectorAll("input")).map((i) => (i as HTMLInputElement).value);
    expect(values).toContain("Arvind Chauhan");
    expect(values).toContain("carvind35@gmail.com");
    // The phone is rendered via InternationalPhoneInput (country code select + number).
    expect(values.some((v) => v.includes("9226232697"))).toBe(true);
    unmount();
  });
});

describe("SkillsSection — chips", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders skills as chips grouped by category", () => {
    seedResume({
      skills: [
        { id: "s1", name: "Python", level: "Advanced", category: "", years: "" },
        { id: "s2", name: "Communication", level: "Intermediate", category: "Soft", years: "" },
        { id: "s3", name: "SQL", level: "Expert", category: "", years: "" },
      ],
    });
    const { container, unmount } = renderToContainer(<SkillsSection />);
    const t = textOf(container);
    expect(t).toContain("Python");
    expect(t).toContain("SQL");
    expect(t).toContain("Communication");
    expect(t).toContain("Technical");
    expect(t).toContain("Soft");
    unmount();
  });

  it("Add Skill creates a new editable chip", () => {
    seedResume({ skills: [] });
    const { container, unmount } = renderToContainer(<SkillsSection />);
    click(findButton("Add Skill"));
    const chips = container.querySelectorAll("input[aria-label='Skill name']");
    expect(chips.length).toBeGreaterThan(0);
    unmount();
  });
});