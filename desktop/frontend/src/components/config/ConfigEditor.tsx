import type { I18nKey } from "../../i18n";
import type { HeaderRow, UserRow } from "../../types/config";
import { HeaderEditor } from "./HeaderEditor";
import { UserEditor } from "./UserEditor";

export function ConfigEditor(props: {
  body: string;
  configText: string;
  method: string;
  requestHeaders: HeaderRow[];
  setBody: (body: string) => void;
  setMethod: (method: string) => void;
  setRequestHeaders: (rows: HeaderRow[]) => void;
  setURL: (url: string) => void;
  setUsers: (users: UserRow[]) => void;
  t: (key: I18nKey) => string;
  url: string;
  users: UserRow[];
}) {
  return (
    <div className="request-form">
      <div className="request-line">
        <label>
          {props.t("request.method")}
          <select value={props.method} onChange={(event) => props.setMethod(event.target.value)}>
            {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          {props.t("request.url")}
          <input value={props.url} onChange={(event) => props.setURL(event.target.value)} />
        </label>
      </div>

      <HeaderEditor title={props.t("request.headers")} addLabel={props.t("command.add")} deleteLabel={props.t("command.delete")} keyLabel={props.t("table.key")} valueLabel={props.t("table.value")} rows={props.requestHeaders} onChange={props.setRequestHeaders} />

      <label className="body-editor">
        {props.t("request.body")}
        <textarea spellCheck="false" value={props.body} onChange={(event) => props.setBody(event.target.value)} />
      </label>

      <UserEditor users={props.users} onChange={props.setUsers} t={props.t} />

      <label className="json-preview">
        {props.t("request.jsonPreview")}
        <textarea spellCheck="false" readOnly value={props.configText} />
      </label>
    </div>
  );
}
