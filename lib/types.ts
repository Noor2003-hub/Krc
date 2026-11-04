import type { ExpenseCategory, Kind, Method, Shift, Status } from "./rules";

export type Admin = {
  id: string;
  name: string;
  email: string;
  must_change_password: boolean;
  last_login_at: string | null;
};

export type Settings = { cutoff_day: number; default_fee: number };

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  kind: Kind;
  shift: Shift;
  monthly_fee: number | null;
  joined_on: string | null;
  active: boolean;
  notes: string | null;
};

export type Invoice = {
  id: number;
  customer_id: string;
  kind: Kind;
  shift: Shift;
  invoice_date: string;
  period_month: string | null;
  amount: number;
  status: Status;
  method: Method | null;
  method_note: string | null;
  paid_on: string | null;
  reference: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceWithCustomer = Invoice & {
  customer: Pick<Customer, "id" | "name" | "phone"> | null;
};

export type Expense = {
  id: number;
  month: string;
  category: ExpenseCategory;
  amount: number;
  spent_on: string;
  description: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
};

export type InvoiceEvent = {
  id: number;
  invoice_id: number;
  admin_id: string | null;
  action: string;
  summary: string | null;
  created_at: string;
};
