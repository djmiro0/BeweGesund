declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      "mux-player": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "playback-id"?: string;
        "playback-token"?: string;
        poster?: string;
        "metadata-video-id"?: string;
        "metadata-video-title"?: string;
        "metadata-viewer-user-id"?: string;
        "metadata-custom-1"?: string;
        "stream-type"?: "on-demand" | "live";
        "auto-play"?: string;
      };
    }
  }
}

export {};
