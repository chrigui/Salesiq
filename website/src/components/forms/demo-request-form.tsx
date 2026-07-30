"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDUSTRY_OPTIONS, COMPANY_SIZE_OPTIONS, demoRequestSchema } from "@/lib/demo-request-schema";

type Status = "idle" | "submitting" | "success" | "error";

export function DemoRequestForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      company: String(formData.get("company") ?? ""),
      companySize,
      industry,
      message: String(formData.get("message") ?? ""),
    };

    const parsed = demoRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const friendly: Record<string, string> = {
        companySize: "Select a company size.",
        industry: "Select your industry.",
      };
      const fieldErrors: Record<string, string> = {};
      for (const [field, messages] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (messages?.[0]) fieldErrors[field] = friendly[field] ?? messages[0];
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setStatus("submitting");

    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("error");
      setFormError("Something went wrong on our end — please try again, or email us directly.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-accent-wash bg-accent-wash/40 px-8 py-16 text-center">
        <CheckCircle2 className="h-8 w-8 text-accent-ink" aria-hidden="true" />
        <h3 className="text-xl text-ink">Request received.</h3>
        <p className="max-w-sm text-[14.5px] text-ink-muted">
          Our team replies within one business day to schedule a walkthrough built around your use case.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" placeholder="Jordan Blake" required autoComplete="name" />
          {errors.name && <p className="mt-1.5 text-[12.5px] text-pending">{errors.name}</p>}
        </div>
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input id="email" name="email" type="email" placeholder="jordan@company.com" required autoComplete="email" />
          {errors.email && <p className="mt-1.5 text-[12.5px] text-pending">{errors.email}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" placeholder="Company name" required autoComplete="organization" />
          {errors.company && <p className="mt-1.5 text-[12.5px] text-pending">{errors.company}</p>}
        </div>
        <div>
          <Label htmlFor="companySize">Company size</Label>
          <Select value={companySize} onValueChange={setCompanySize} name="companySize">
            <SelectTrigger id="companySize">
              <SelectValue placeholder="Select a range" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.companySize && <p className="mt-1.5 text-[12.5px] text-pending">{errors.companySize}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="industry">Industry</Label>
        <Select value={industry} onValueChange={setIndustry} name="industry">
          <SelectTrigger id="industry">
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.industry && <p className="mt-1.5 text-[12.5px] text-pending">{errors.industry}</p>}
      </div>

      <div>
        <Label htmlFor="message">What are you hoping to solve? (optional)</Label>
        <Textarea id="message" name="message" rows={4} placeholder="A sentence or two on your use case is plenty." />
      </div>

      {formError && <p className="text-[13px] text-pending">{formError}</p>}

      <Button type="submit" size="lg" disabled={status === "submitting"} className="mt-1">
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending…
          </>
        ) : (
          "Request a demo"
        )}
      </Button>
      <p className="text-[12.5px] text-ink-muted">We reply within one business day. No calendar spam, no drip campaign.</p>
    </form>
  );
}
