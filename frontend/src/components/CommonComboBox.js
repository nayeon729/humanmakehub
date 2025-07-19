import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export default function CommonComboBox({
  options,
  value,
  onChange,
  placeholder = '선택하세요',
  disabled = false,
  sx,
  label
}) {
  const hasLabel = Boolean(label);

  return (
    <FormControl fullWidth disabled={disabled} sx={sx} variant="outlined">
      {hasLabel ? (
        <>
          <InputLabel id="combo-label">{label}</InputLabel>
          <Select
            labelId="combo-label"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            label={label} // 라벨 있는 경우에만!
          >
            <MenuItem value="" disabled>
              {placeholder}
            </MenuItem>
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </>
      ) : (
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          displayEmpty
          inputProps={{ 'aria-label': placeholder }}
        >
          <MenuItem value="" disabled>
            {placeholder}
          </MenuItem>
          {options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} disabled={opt.value == "R01" || opt.value == "R04"}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      )}
    </FormControl>
  );
}
