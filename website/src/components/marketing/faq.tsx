"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

export function FAQ({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <Accordion.Root type="single" collapsible className="divide-y divide-line">
      {items.map((item, i) => (
        <Accordion.Item key={item.question} value={`item-${i}`} className="py-1">
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left text-[15.5px] font-medium text-ink transition-colors hover:text-accent-ink">
              {item.question}
              <ChevronDown
                className="h-4 w-4 shrink-0 text-ink-faint transition-transform duration-300 group-data-[state=open]:rotate-180"
                aria-hidden="true"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden text-[14.5px] leading-relaxed text-ink-muted data-[state=open]:animate-fade-up">
            <p className="pb-5 pr-8">{item.answer}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
