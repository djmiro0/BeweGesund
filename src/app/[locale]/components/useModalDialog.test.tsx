import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { useModalDialog } from "./useModalDialog";

function DialogHarness() {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useModalDialog<HTMLElement>(isOpen, () => setIsOpen(false));

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open dialog
      </button>
      {isOpen ? (
        <section
          ref={dialogRef}
          role="dialog"
          aria-label="Example dialog"
          tabIndex={-1}
        >
          <button type="button">First action</button>
          <button type="button">Last action</button>
        </section>
      ) : null}
    </>
  );
}

describe("useModalDialog", () => {
  it("focuses, contains, dismisses, and restores focus", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Example dialog" });
    expect(dialog).toHaveFocus();

    const firstAction = screen.getByRole("button", { name: "First action" });
    const lastAction = screen.getByRole("button", { name: "Last action" });
    await user.tab();
    expect(firstAction).toHaveFocus();

    lastAction.focus();
    await user.tab();
    expect(firstAction).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
