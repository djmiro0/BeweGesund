import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PageMediaGate from "./PageMediaGate";

vi.mock("next/navigation", () => ({
  usePathname: () => "/de/blogs",
}));

function PendingImage() {
  return (
    // The gate observes the browser's final img element, not Next Image props.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={(image) => {
        if (!image) return;

        Object.defineProperties(image, {
          complete: { configurable: true, value: false },
          naturalWidth: { configurable: true, value: 1200 },
          decode: {
            configurable: true,
            value: vi.fn().mockResolvedValue(undefined),
          },
        });
      }}
      src="/blog-image.jpg"
      alt=""
      data-page-ready="true"
    />
  );
}

describe("PageMediaGate", () => {
  it("keeps page content hidden until its critical image is decoded", async () => {
    render(
      <PageMediaGate>
        <p>Article text</p>
        <PendingImage />
      </PageMediaGate>,
    );

    const content = screen.getByTestId("page-media-content");
    expect(content).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("page-media-loading")).toBeInTheDocument();

    await new Promise<void>((resolve) =>
      window.requestAnimationFrame(() => resolve()),
    );
    const image = content.querySelector("img");
    expect(image).not.toBeNull();
    fireEvent.load(image!);

    await waitFor(() =>
      expect(
        screen.queryByTestId("page-media-loading"),
      ).not.toBeInTheDocument(),
    );
    expect(content).not.toHaveAttribute("aria-hidden");
  });

  it("shows pages without critical images after the layout check", async () => {
    render(
      <PageMediaGate>
        <p>Text-only page</p>
      </PageMediaGate>,
    );

    await waitFor(() =>
      expect(
        screen.queryByTestId("page-media-loading"),
      ).not.toBeInTheDocument(),
    );
  });
});
