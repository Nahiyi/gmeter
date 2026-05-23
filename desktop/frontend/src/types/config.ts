export type HeaderRow = {
  id: string;
  key: string;
  value: string;
};

export type UserRow = {
  id: string;
  headers: HeaderRow[];
};

export type RequestConfig = {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
};

export type UserConfig = {
  headers?: Record<string, string>;
};

export type GmeterConfig = {
  request: RequestConfig;
  users?: UserConfig[];
};

export type WorkbenchView = "config" | "results";
