"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { ChevronDown, Search } from "lucide-react";

export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵" },
  { name: "China", code: "CN", dialCode: "+86", flag: "🇨🇳" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪" },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬" },
  { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  { name: "Mexico", code: "MX", dialCode: "+52", flag: "🇲🇽" },
  { name: "South Korea", code: "KR", dialCode: "+82", flag: "🇰🇷" },
  { name: "Italy", code: "IT", dialCode: "+39", flag: "🇮🇹" },
  { name: "Spain", code: "ES", dialCode: "+34", flag: "🇪🇸" },
  { name: "Netherlands", code: "NL", dialCode: "+31", flag: "🇳🇱" },
  { name: "Switzerland", code: "CH", dialCode: "+41", flag: "🇨🇭" },
  { name: "Sweden", code: "SE", dialCode: "+46", flag: "🇸🇪" },
  { name: "New Zealand", code: "NZ", dialCode: "+64", flag: "🇳🇿" },
];

interface InternationalPhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
}

export function InternationalPhoneInput({
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder = "98765 43210",
}: InternationalPhoneInputProps) {
  const parseInitial = () => {
    const trimmed = (value || "").trim();
    for (const c of [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)) {
      if (trimmed.startsWith(c.dialCode)) {
        const local = trimmed.slice(c.dialCode.length).trim();
        return { country: c, local };
      }
    }
    return { country: COUNTRIES[0], local: trimmed.replace(/^\+\d+\s*/, "") };
  };

  const initial = parseInitial();
  const [selectedCountry, setSelectedCountry] = useState<Country>(initial.country);
  const [localNumber, setLocalNumber] = useState<string>(initial.local);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parsed = parseInitial();
    if (parsed.country) setSelectedCountry(parsed.country);
    if (parsed.local !== undefined) setLocalNumber(parsed.local);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountryChange = (c: Country) => {
    setSelectedCountry(c);
    setIsOpen(false);
    setSearch("");
    const combined = `${c.dialCode} ${localNumber}`.trim();
    onChange(combined);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^\d\s\-()]/g, "");
    setLocalNumber(num);
    const combined = `${selectedCountry.dialCode} ${num}`.trim();
    onChange(combined);
  };

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#94a3b8] tracking-wide">{label}</label>
      </div>

      <div className="relative flex items-center" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "flex items-center gap-1.5 px-3.5 py-3 bg-[#070d18] border rounded-l-xl text-sm text-[#f8fafc] font-medium transition-all duration-200 cursor-pointer shrink-0",
            "border-[rgba(148,163,184,.2)] hover:border-[rgba(148,163,184,.35)] focus:outline-none focus:border-cyan-400"
          )}
        >
          <span className="text-base">{selectedCountry.flag}</span>
          <span className="font-mono text-xs text-cyan-300">{selectedCountry.dialCode}</span>
          <ChevronDown className="w-3 h-3 text-[#94a3b8]" />
        </button>

        <input
          type="tel"
          value={localNumber}
          onChange={handleNumberChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={clsx(
            "w-full bg-[#070d18] border-l-0 border rounded-r-xl text-sm text-[#f8fafc] font-medium",
            "focus:outline-none focus:ring-1 transition-all duration-200",
            "placeholder:text-[#64748b]",
            "hover:border-[rgba(148,163,184,.35)]",
            "focus:shadow-[0_0_25px_rgba(34,211,238,0.12)]",
            error
              ? "border-red-500/50 focus:border-red-500/80 focus:ring-red-500/20"
              : "border-[rgba(148,163,184,.2)] focus:border-cyan-400 focus:ring-cyan-500/30",
            "px-4 py-3"
          )}
        />

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-[#070d18] border border-[rgba(148,163,184,.2)] rounded-2xl shadow-2xl z-50 p-2">
            <div className="p-2 border-b border-[rgba(148,163,184,.14)]">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full bg-white/[0.04] border border-[rgba(148,163,184,.2)] rounded-xl text-xs text-white pl-9 pr-3 py-2 outline-none focus:border-cyan-400 placeholder:text-[#64748b]"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
              {filteredCountries.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#94a3b8]">No country found</div>
              ) : (
                filteredCountries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountryChange(c)}
                    className={clsx(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer",
                      selectedCountry.code === c.code
                        ? "bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-white font-semibold border border-cyan-500/30"
                        : "text-[#94a3b8] hover:bg-white/[0.04] hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{c.flag}</span>
                      <span className="font-medium text-white">{c.name}</span>
                    </div>
                    <span className="font-mono text-cyan-300 text-[11px]">{c.dialCode}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}
