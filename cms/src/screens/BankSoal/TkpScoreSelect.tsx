import { Select } from "antd";

export const DEFAULT_TKP_SCORES = [5, 4, 3, 2, 1];

/** Points (1-5) of one TKP option, shown next to the option input. */
const TkpScoreSelect = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => (
  <Select
    value={value}
    onChange={onChange}
    style={{ width: 96 }}
    options={[5, 4, 3, 2, 1].map((score) => ({ value: score, label: `${score} poin` }))}
  />
);

export default TkpScoreSelect;
