/** { label, href } — About_Fields::button() */
export interface AboutButton {
  label: string;
  href: string;
}

/** About_Fields::ICON_CHOICES keys — mapped to lucide-react icons in the frontend icon map. */
export type AboutIconKey =
  | "message-chat"
  | "zap"
  | "chart-breakout"
  | "message-smile"
  | "command"
  | "message-heart";

export interface AboutHero {
  eyebrow: string;
  heading: string;
  subheading: string;
  primary_button: AboutButton;
  secondary_button: AboutButton;
}

export interface AboutCommitmentBlock {
  icon: AboutIconKey;
  heading: string;
  text: string;
  check_items: string[];
  image: string | null;
}

export interface AboutCommitmentSection {
  heading: string;
  subheading: string;
  blocks: AboutCommitmentBlock[];
}

export interface AboutValueCard {
  icon: AboutIconKey;
  title: string;
  description: string;
}

export interface AboutValues {
  eyebrow: string;
  heading: string;
  cards: AboutValueCard[];
}

export interface AboutTeam {
  eyebrow: string;
  heading: string;
  text: string;
  primary_button: AboutButton;
  secondary_button: AboutButton;
  /** Always exactly 5 slots; null entries render as placeholders. */
  photos: Array<string | null>;
}

/** About_Controller::get_page() response shape. */
export interface AboutPageData {
  hero: AboutHero;
  commitment_section: AboutCommitmentSection;
  values: AboutValues;
  team: AboutTeam;
}
