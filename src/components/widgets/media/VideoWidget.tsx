'use client';

import { useRef, useEffect } from 'react';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function VideoWidget({ width, height, props, isEditing }: WidgetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    src = '',
    poster = '',
    autoplay = true,
    loop = true,
    muted = true,
    controls = false,
    objectFit = 'cover',
    borderRadius = 0,
    backgroundColor = '#000',
  } = props as {
    src?: string;
    poster?: string;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    objectFit?: string;
    borderRadius?: number;
    backgroundColor?: string;
  };

  // Auto-play when not editing
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (autoplay && !isEditing) {
      video.play().catch(() => {
        // Autoplay may be blocked by browser policy
      });
    }
  }, [src, autoplay, isEditing]);

  if (!src) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center border border-dashed border-gray-600 text-xs text-gray-500"
        style={{ width, height, borderRadius, backgroundColor }}
      >
        <svg className="w-8 h-8 mb-1 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
          <rect x="2.25" y="4.5" width="19.5" height="15" rx="2.25" />
        </svg>
        No video URL set
      </div>
    );
  }

  return (
    <div style={{ width, height, borderRadius, overflow: 'hidden', backgroundColor }}>
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        autoPlay={autoplay && !isEditing}
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: objectFit as 'contain' | 'cover' | 'fill',
        }}
      />
    </div>
  );
}

registerComponent({
  type: 'video',
  label: 'Video / Stream',
  icon: 'Video',
  category: 'media',
  description: 'Video player or livestream (MP4, HLS URL)',
  defaultProps: {
    src: '',
    poster: '',
    autoplay: true,
    loop: true,
    muted: true,
    controls: false,
    objectFit: 'cover',
    borderRadius: 0,
    backgroundColor: '#000',
  },
  propSchema: [
    { key: 'src', type: 'string', label: 'Video URL', group: 'Basic' },
    { key: 'poster', type: 'string', label: 'Poster Image URL', group: 'Basic' },
    { key: 'autoplay', type: 'boolean', label: 'Autoplay', group: 'Playback' },
    { key: 'loop', type: 'boolean', label: 'Loop', group: 'Playback' },
    { key: 'muted', type: 'boolean', label: 'Muted', group: 'Playback' },
    { key: 'controls', type: 'boolean', label: 'Show Controls', group: 'Playback' },
    { key: 'objectFit', type: 'select', label: 'Fit Mode', group: 'Style', options: [
      { label: 'Cover', value: 'cover' },
      { label: 'Contain', value: 'contain' },
      { label: 'Fill', value: 'fill' },
    ]},
    { key: 'borderRadius', type: 'number', label: 'Border Radius', group: 'Style', min: 0, max: 50, step: 1 },
    { key: 'backgroundColor', type: 'color', label: 'Background', group: 'Style' },
  ],
  render: VideoWidget,
});

export default VideoWidget;
