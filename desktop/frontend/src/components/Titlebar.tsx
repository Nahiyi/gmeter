import { ChangeEvent, RefObject } from "react";
import type { I18nKey, Locale } from "../i18n";

export function Titlebar(props: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isRunning: boolean;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onOpenClick: () => void;
  onOpenFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onRun: () => void;
  onSave: () => void;
  onStop: () => void;
  t: (key: I18nKey) => string;
}) {
  return (
    <header className="titlebar">
      <div>
        <strong>{props.t("app.title")}</strong>
        <span>{props.t("app.subtitle")}</span>
      </div>
      <div className="titlebar-actions">
        <input ref={props.fileInputRef} className="file-input" type="file" accept=".json,application/json" onChange={props.onOpenFile} />
        <select className="locale-select" value={props.locale} onChange={(event) => props.onLocaleChange(event.target.value as Locale)}>
          <option value="en">EN</option>
          <option value="zh">中文</option>
        </select>
        <button type="button" onClick={props.onOpenClick}>{props.t("command.open")}</button>
        <button type="button" onClick={props.onSave}>{props.t("command.save")}</button>
        {props.isRunning ? (
          <button type="button" className="danger" onClick={props.onStop}>{props.t("command.stop")}</button>
        ) : (
          <button type="button" className="primary" onClick={props.onRun}>{props.t("command.run")}</button>
        )}
      </div>
    </header>
  );
}
