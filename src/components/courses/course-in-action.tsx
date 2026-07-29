"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface CourseInActionProps {
  videoUrl: string | null;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

export function CourseInAction({ videoUrl }: CourseInActionProps) {
  const [playing, setPlaying] = useState(false);

  if (!videoUrl) return null;

  const videoId = getYouTubeId(videoUrl);
  if (!videoId) return null;

  const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <section>
      <h2 className="font-suse text-[32px] leading-[1.2] font-medium text-neutral-900">
        Course in action
      </h2>

      {playing ? (
        <div className="mt-8 aspect-video w-full">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title="Course in action"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full rounded-lg"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="relative mt-8 w-full overflow-hidden rounded-lg"
          style={{ aspectRatio: "16 / 9" }}
        >
          <img
            src={thumbnail}
            alt="Course preview"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-105">
              <Play className="text-secondary-500 ml-1 h-10 w-10 cursor-pointer" />
            </div>
          </div>
        </button>
      )}
    </section>
  );
}
