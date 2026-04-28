export const PROFILE_SECTIONS = [
  { value: 'identity', label: 'Identity' },
  { value: 'workAvailability', label: 'Work Availability' },
  { value: 'contact', label: 'Contact' },
  { value: 'location', label: 'Location' },
  { value: 'socialLinks', label: 'Social Links' },
  { value: 'seoOg', label: 'SEO & OG' },
  { value: 'adminContactAddress', label: 'Admin Contact & Address' },
] as const;

export const AVAILABILITY_OPTIONS = [
  { value: 'EMPLOYED', label: 'Employed' },
  { value: 'OPEN_TO_WORK', label: 'Open to Work' },
  { value: 'FREELANCING', label: 'Freelancing' },
  { value: 'NOT_AVAILABLE', label: 'Not Available' },
] as const;

export const OPEN_TO_OPTIONS = [
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'CONSULTING', label: 'Consulting' },
  { value: 'SIDE_PROJECT', label: 'Side Project' },
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'SPEAKING', label: 'Speaking' },
  { value: 'OPEN_SOURCE', label: 'Open Source' },
] as const;

export const SOCIAL_PLATFORM_OPTIONS = [
  { value: 'GITHUB', label: 'GitHub' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'TWITTER', label: 'Twitter / X' },
  { value: 'BLUESKY', label: 'Bluesky' },
  { value: 'STACKOVERFLOW', label: 'Stack Overflow' },
  { value: 'DEV_TO', label: 'Dev.to' },
  { value: 'HASHNODE', label: 'Hashnode' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const TIMEZONE_OPTIONS = [
  'UTC',
  'Asia/Ho_Chi_Minh',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Bangkok',
  'Australia/Sydney',
] as const;
