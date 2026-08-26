/**
 * The three thank-you/salesperson-story starting points offered on the
 * Recap creation flow — data, not code, matching motionPresets.ts's
 * convention. Each is a real, editable starting draft (spec section 12's
 * THANK YOU / FOLLOW-UP / PERSONAL), never sent as-is without the
 * salesperson seeing and being able to edit it first.
 */
export type RecapMessageTemplateKind = "ThankYou" | "FollowUp" | "Personal";

export interface RecapMessageTemplate {
  kind: RecapMessageTemplateKind;
  label: string;
  buildText: (params: { customerFirstName: string; advisorName: string }) => string;
}

export const RECAP_MESSAGE_TEMPLATES: RecapMessageTemplate[] = [
  {
    kind: "ThankYou",
    label: "Thank you",
    buildText: ({ customerFirstName, advisorName }) =>
      [
        `Thank you for taking the time to meet with us today${customerFirstName ? `, ${customerFirstName}` : ""}.`,
        `It was a pleasure walking through your options together. I've put together everything we discussed below — feel free to revisit it anytime.`,
        ``,
        advisorName,
      ].join("\n"),
  },
  {
    kind: "FollowUp",
    label: "Follow-up",
    buildText: ({ customerFirstName, advisorName }) =>
      [
        `Hi${customerFirstName ? ` ${customerFirstName}` : ""}, just following up on our meeting.`,
        `Everything we covered is saved here for you to revisit whenever you're ready. Let me know if any questions come up.`,
        ``,
        advisorName,
      ].join("\n"),
  },
  {
    kind: "Personal",
    label: "Personal note",
    buildText: ({ customerFirstName, advisorName }) =>
      [
        `${customerFirstName || "Hi"}, I really enjoyed getting to know what matters most to you today.`,
        `I'm confident we found some great options — take your time looking through them, and reach out whenever you'd like to talk it through.`,
        ``,
        advisorName,
      ].join("\n"),
  },
];
