import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render } from "../../test-utils";
import { GlobalShell } from "../GlobalShell";

describe("GlobalShell", () => {
  it("renders the app brand/logo text", () => {
    render(<GlobalShell>content</GlobalShell>);
    expect(screen.getByText("MyApp")).toBeInTheDocument();
  });

  it("renders a Dashboard nav link", () => {
    render(<GlobalShell>content</GlobalShell>);
    const link = screen.getByRole("link", { name: /dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("renders a Login nav link", () => {
    render(<GlobalShell>content</GlobalShell>);
    const link = screen.getByRole("link", { name: /login/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/auth/login");
  });

  it("renders children inside the main section", () => {
    render(
      <GlobalShell>
        <p>Hello world</p>
      </GlobalShell>
    );
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders different children correctly", () => {
    render(
      <GlobalShell>
        <div data-testid="inner-content">Dashboard Widget</div>
      </GlobalShell>
    );
    expect(screen.getByTestId("inner-content")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Widget")).toBeInTheDocument();
  });

  it("includes a navigation landmark", () => {
    render(<GlobalShell>x</GlobalShell>);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("includes a main landmark", () => {
    render(<GlobalShell>x</GlobalShell>);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
