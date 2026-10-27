import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TablePagination } from "./table-pagination";
import { DataTable } from "./data-table";

afterEach(cleanup);

it("shows the reference footer and routes all four controls to the correct page", () => {
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();
  render(<TablePagination page={2} pageSize={20} totalItems={95} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);
  expect(screen.getByText("Showing 21 to 40 of 95 results")).toBeInTheDocument();
  for (const [name, page] of [["First page", 1], ["Previous", 1], ["Next", 3], ["Last page", 5]] as const) {
    fireEvent.click(screen.getByRole("button", { name }));
    expect(onPageChange).toHaveBeenLastCalledWith(page);
  }
  fireEvent.change(screen.getByRole("combobox", { name: "Rows per page" }), { target: { value: "50" } });
  expect(onPageSizeChange).toHaveBeenCalledWith(50);
});

it("keeps all four controls visible and disabled for an empty or single-page table", () => {
  const view = render(<TablePagination page={1} pageSize={20} totalItems={0} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);
  expect(screen.getByText("Showing 0 to 0 of 0 results")).toBeInTheDocument();
  expect(screen.getAllByRole("button")).toHaveLength(4);
  screen.getAllByRole("button").forEach(button => expect(button).toBeDisabled());
  view.rerender(<TablePagination page={1} pageSize={20} totalItems={15} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);
  expect(screen.getByText("Showing 1 to 15 of 15 results")).toBeInTheDocument();
  screen.getAllByRole("button").forEach(button => expect(button).toBeDisabled());
});

it("disables page navigation and page-size changes while a request is loading", () => {
  render(<TablePagination page={2} pageSize={20} totalItems={95} loading onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);
  expect(screen.getByRole("combobox", { name: "Rows per page" })).toBeDisabled();
  screen.getAllByRole("button").forEach(button => expect(button).toBeDisabled());
});

it("gives each footer an independent, associated page-size label", () => {
  render(<><TablePagination label="First table pages" page={1} pageSize={20} totalItems={1} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} /><TablePagination label="Second table pages" page={1} pageSize={50} totalItems={1} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} /></>);
  const first = within(screen.getByRole("navigation", { name: "First table pages" })).getByLabelText("Rows per page");
  const second = within(screen.getByRole("navigation", { name: "Second table pages" })).getByLabelText("Rows per page");
  expect(first.id).not.toBe(second.id);
  expect(first).toHaveValue("20");
  expect(second).toHaveValue("50");
});

it("actually slices client-side table rows and resets pagination when page size changes", () => {
  const data = Array.from({ length: 45 }, (_, index) => ({ name: `Record ${index + 1}` }));
  render(<DataTable data={data} columns={[{ accessorKey: "name", header: "Name" }]} />);
  expect(screen.getByText("Record 20")).toBeInTheDocument();
  expect(screen.queryByText("Record 21")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Last page" }));
  expect(screen.getByText("Showing 41 to 45 of 45 results")).toBeInTheDocument();
  expect(screen.getByText("Record 45")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Rows per page"), { target: { value: "10" } });
  expect(screen.getByText("Showing 1 to 10 of 45 results")).toBeInTheDocument();
  expect(screen.getByText("Record 1")).toBeInTheDocument();
  expect(screen.queryByText("Record 11")).not.toBeInTheDocument();
});
