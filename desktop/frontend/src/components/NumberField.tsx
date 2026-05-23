export function NumberField(props: { label: string; min: number; value: number; onChange: (value: number) => void }) {
  return (
    <label>
      {props.label}
      <input type="number" min={props.min} value={props.value} onChange={(event) => props.onChange(Number(event.target.value))} />
    </label>
  );
}
