import { ChangeEvent, RefObject, useEffect, useRef, useState } from "react";
import { Quit, WindowMinimise, WindowToggleMaximise } from "../../wailsjs/runtime/runtime";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  function closeAfter(action: () => void) {
    action();
    setMenuOpen(false);
  }

  return (
    <header className="titlebar">
      <div className="titlebar-left">
        <input ref={props.fileInputRef} className="file-input" type="file" accept=".json,application/json" onChange={props.onOpenFile} />
        <div className="app-menu" ref={menuRef}>
          <button
            type="button"
            className="menu-trigger titlebar-control"
            aria-expanded={menuOpen}
            aria-label={props.t("command.menu")}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="icon menu-icon" aria-hidden="true" />
          </button>
          {menuOpen ? (
            <div className="app-menu-popover" role="menu">
              <button type="button" role="menuitem" onClick={() => closeAfter(props.onOpenClick)}>
                <span>{props.t("command.open")}</span>
              </button>
              <button type="button" role="menuitem" onClick={() => closeAfter(props.onSave)}>
                <span>{props.t("command.save")}</span>
              </button>
              <div className="menu-separator" />
              <label className="menu-select-row">
                <span>{props.t("command.language")}</span>
                <select value={props.locale} onChange={(event) => props.onLocaleChange(event.target.value as Locale)}>
                  <option value="en">EN</option>
                  <option value="zh">中文</option>
                </select>
              </label>
            </div>
          ) : null}
        </div>
        <div className="titlebar-drag-region">
          <div className="titlebar-brand">
            <strong>{props.t("app.title")}</strong>
            <span>{props.t("app.subtitle")}</span>
          </div>
        </div>
      </div>
      <div className="titlebar-actions">
        {props.isRunning ? (
          <button type="button" className="icon-command titlebar-control danger" aria-label={props.t("command.stopRun")} title={props.t("command.stopRun")} onClick={props.onStop}>
            <span className="icon stop-icon" aria-hidden="true" />
          </button>
        ) : (
          <button type="button" className="icon-command titlebar-control primary" aria-label={props.t("command.startRun")} title={props.t("command.startRun")} onClick={props.onRun}>
            <span className="icon run-icon" aria-hidden="true" />
          </button>
        )}
        <div className="window-controls" aria-label="Window controls">
          <button type="button" className="window-command" aria-label={props.t("command.minimize")} title={props.t("command.minimize")} onClick={WindowMinimise}>
            <span className="window-icon minimize-icon" aria-hidden="true" />
          </button>
          <button type="button" className="window-command" aria-label={props.t("command.maximize")} title={props.t("command.maximize")} onClick={WindowToggleMaximise}>
            <span className="window-icon maximize-icon" aria-hidden="true" />
          </button>
          <button type="button" className="window-command close-command" aria-label={props.t("command.close")} title={props.t("command.close")} onClick={Quit}>
            <span className="window-icon close-icon" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
