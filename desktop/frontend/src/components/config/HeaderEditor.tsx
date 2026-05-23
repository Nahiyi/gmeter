import type { I18nKey } from "../../i18n";
import type { HeaderRow } from "../../types/config";
import { createID } from "../../utils/configRows";

export function HeaderEditor(props: {
  title: string;
  addLabel: string;
  deleteLabel: string;
  keyLabel: string;
  valueLabel: string;
  rows: HeaderRow[];
  onChange: (rows: HeaderRow[]) => void;
}) {
  function updateRow(id: string, patch: Partial<HeaderRow>) {
    props.onChange(props.rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  }

  return (
    <section className="table-editor">
      <div className="subheading">
        <span>{props.title}</span>
        <button type="button" onClick={() => props.onChange([...props.rows, { id: createID(), key: "", value: "" }])}>{props.addLabel}</button>
      </div>
      <div className="header-grid header-grid-head">
        <span>{props.keyLabel}</span>
        <span>{props.valueLabel}</span>
        <span />
      </div>
      {props.rows.map((row) => (
        <div className="header-grid" key={row.id}>
          <input value={row.key} onChange={(event) => updateRow(row.id, { key: event.target.value })} />
          <input value={row.value} onChange={(event) => updateRow(row.id, { value: event.target.value })} />
          <button type="button" onClick={() => props.onChange(props.rows.filter((item) => item.id !== row.id))}>{props.deleteLabel}</button>
        </div>
      ))}
    </section>
  );
}

export type Translate = (key: I18nKey) => string;
