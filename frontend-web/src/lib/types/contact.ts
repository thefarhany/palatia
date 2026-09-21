export const CONTACT_TOPICS = ["General", "Catering", "Private Event", "Partnership"] as const;

export type ContactTopic = typeof CONTACT_TOPICS[number];

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  topic?: ContactTopic;
}
