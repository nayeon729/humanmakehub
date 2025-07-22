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

  const selectSx = {
    fontSize: sx?.fontSize || '14px', // fontSize만 따로 꺼내서 Select에 전달
  };

  const menuItemSx = {
    fontSize: sx?.fontSize || '14px', // 각 메뉴에도 동일하게 적용
  };

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
            sx={selectSx}
          >
            <MenuItem value="" disabled sx={menuItemSx}>
              {placeholder}
            </MenuItem>
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={menuItemSx}>
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
          sx={selectSx}
        >
          <MenuItem value="" disabled sx={menuItemSx}>
            {placeholder}
          </MenuItem>
          {options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} disabled={opt.value == "R01" || opt.value == "R04"} sx={menuItemSx}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      )}
    </FormControl>
  );
}
