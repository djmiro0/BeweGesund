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
        "metadata-video-title"?: string;
        "stream-type"?: "on-demand" | "live";
        "auto-play"?: string;
      };
    }
  }
}

export {};
