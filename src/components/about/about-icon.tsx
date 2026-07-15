import { MessageCircle, Zap, TrendingUp, Smile, Command, Heart } from "lucide-react";
import type { AboutIconKey } from "@/types/about";

const ICON_MAP: Record<AboutIconKey, typeof MessageCircle> = {
  "message-chat": MessageCircle,
  zap: Zap,
  "chart-breakout": TrendingUp,
  "message-smile": Smile,
  command: Command,
  "message-heart": Heart,
};

/** The circular "Featured icon" bubble used in the commitment blocks and values grid. */
export function AboutIcon({ icon }: { icon: AboutIconKey }) {
  const Icon = ICON_MAP[icon] ?? MessageCircle;
  return (
    <span className="bg-primary-100 border-primary-50 flex size-12 shrink-0 items-center justify-center rounded-full border-8">
      <Icon className="text-primary-700 h-6 w-6" />
    </span>
  );
}
