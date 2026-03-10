import { screen, waitFor } from "@testing-library/react";
import { lazy } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "../../test-utils";
import { RemoteBoundary } from "../RemoteBoundary";

function BrokenRemote(): never {
  throw new Error("ChunkLoadError: remote module unreachable");
}

function makeSuspendingRemote() {
  return lazy(() => new Promise<{ default: () => null }>(() => {}));
}

const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalError;
});

describe("RemoteBoundary", () => {
  it("renders children when the remote loads successfully", () => {
    render(
      <RemoteBoundary name="TestRemote">
        <div>Remote content loaded</div>
      </RemoteBoundary>
    );
    expect(screen.getByText("Remote content loaded")).toBeInTheDocument();
  });

  it("shows the loading spinner while the remote is pending", async () => {
    const SuspendingRemote = makeSuspendingRemote();

    render(
      <RemoteBoundary name="AuthApp">
        <SuspendingRemote />
      </RemoteBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText(/loading authapp/i)).toBeInTheDocument();
    });
  });

  it("uses a custom fallback when provided", async () => {
    const SuspendingRemote = makeSuspendingRemote();

    render(
      <RemoteBoundary name="AuthApp" fallback={<div>Custom spinner</div>}>
        <SuspendingRemote />
      </RemoteBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText("Custom spinner")).toBeInTheDocument();
    });
  });

  it("renders the error card when a remote throws", () => {
    render(
      <RemoteBoundary name="DashboardApp">
        <BrokenRemote />
      </RemoteBoundary>
    );

    expect(screen.getByText(/failed to load dashboardapp/i)).toBeInTheDocument();
  });

  it("shows the error message from the thrown error", () => {
    render(
      <RemoteBoundary name="DashboardApp">
        <BrokenRemote />
      </RemoteBoundary>
    );

    expect(screen.getByText(/chunkloaderror: remote module unreachable/i)).toBeInTheDocument();
  });

  it("renders Retry and Go Home buttons on error", () => {
    render(
      <RemoteBoundary name="DashboardApp">
        <BrokenRemote />
      </RemoteBoundary>
    );

    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go home/i })).toBeInTheDocument();
  });

  it("includes the remote name in the loading text", async () => {
    const SuspendingRemote = makeSuspendingRemote();

    render(
      <RemoteBoundary name="MySpecialRemote">
        <SuspendingRemote />
      </RemoteBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText(/myspecialremote/i)).toBeInTheDocument();
    });
  });

  it("includes the remote name in the error heading", () => {
    render(
      <RemoteBoundary name="MySpecialRemote">
        <BrokenRemote />
      </RemoteBoundary>
    );

    expect(screen.getByText(/failed to load myspecialremote/i)).toBeInTheDocument();
  });
});
