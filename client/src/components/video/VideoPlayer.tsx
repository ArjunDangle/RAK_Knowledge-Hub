import React from 'react';

interface VideoPlayerProps {
  fileUrl: string;
}

export function VideoPlayer({ fileUrl }: VideoPlayerProps) {
  return (
    <div className="not-prose my-6 border rounded-md overflow-hidden bg-black flex items-center justify-center shadow-lg">
      <video
        controls
        src={fileUrl}
        className="w-full max-h-[70vh] aspect-video"
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}