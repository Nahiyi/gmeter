import type { I18nKey } from "../../i18n";
import type { HeaderRow, UserRow } from "../../types/config";
import { createID } from "../../utils/configRows";
import { HeaderEditor } from "./HeaderEditor";

export function UserEditor(props: { users: UserRow[]; onChange: (users: UserRow[]) => void; t: (key: I18nKey) => string }) {
  function updateUser(userID: string, headers: HeaderRow[]) {
    props.onChange(props.users.map((user) => user.id === userID ? { ...user, headers } : user));
  }

  return (
    <section className="users-editor">
      <div className="subheading">
        <span>{props.t("request.userHeaders")}</span>
        <button type="button" onClick={() => props.onChange([...props.users, { id: createID(), headers: [] }])}>{props.t("command.addUser")}</button>
      </div>
      {props.users.length === 0 ? (
        <div className="trace-empty">{props.t("request.noUserHeaders")}</div>
      ) : (
        props.users.map((user, index) => (
          <div className="user-block" key={user.id}>
            <div className="user-title">
              <span>{props.t("request.user")} {index + 1}</span>
              <button type="button" onClick={() => props.onChange(props.users.filter((item) => item.id !== user.id))}>{props.t("command.remove")}</button>
            </div>
            <HeaderEditor title={props.t("request.headers")} addLabel={props.t("command.add")} deleteLabel={props.t("command.delete")} keyLabel={props.t("table.key")} valueLabel={props.t("table.value")} rows={user.headers} onChange={(rows) => updateUser(user.id, rows)} />
          </div>
        ))
      )}
    </section>
  );
}
