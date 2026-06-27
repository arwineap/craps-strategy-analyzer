export interface ParamDef {
  key: string;
  label: string;
  type: 'number' | 'boolean';
  default: number | boolean;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export const STRATEGY_PARAMS: Record<string, ParamDef[]> = {
  'Pass Line + Max Odds': [
    { key: 'oddsMultiplier', label: 'Odds Multiplier', type: 'number', default: 2, min: 1, max: 100, step: 1 },
  ],
  "Don't Pass + Lay Odds": [
    { key: 'oddsMult', label: 'Odds Multiplier', type: 'number', default: 2, min: 1, max: 100, step: 1 },
  ],
  'Place 6 & 8': [
    { key: 'betSize', label: 'Bet Size ($)', type: 'number', default: 30, min: 6, step: 6, description: 'Must be a multiple of $6' },
  ],
  'Three Point Molly': [
    { key: 'oddsMult', label: 'Odds Multiplier', type: 'number', default: 2, min: 1, max: 100, step: 1 },
  ],
  'Iron Cross': [
    { key: 'fieldBet',  label: 'Field Bet ($)',    type: 'number', default: 0, min: 0, step: 5, description: '0 = use table minimum' },
    { key: 'place59',   label: 'Place 5/9 ($)',    type: 'number', default: 0, min: 0, step: 5, description: '0 = use table minimum' },
    { key: 'place68',   label: 'Place 6/8 ($)',    type: 'number', default: 0, min: 0, step: 6, description: '0 = use table minimum × 1.2' },
  ],
  'Iron Cross Hedge': [
    { key: 'fieldBet', label: 'Field Bet ($)',   type: 'number', default: 0, min: 0, step: 5, description: '0 = use table minimum' },
    { key: 'place5',   label: 'Place 5 ($)',     type: 'number', default: 0, min: 0, step: 5, description: '0 = use table minimum' },
    { key: 'place68',  label: 'Place 6/8 ($)',   type: 'number', default: 0, min: 0, step: 6, description: '0 = table minimum × 2.4' },
  ],
  'High Roller Props': [
    { key: 'hardBet',     label: 'Hardway Bet ($)',  type: 'number',  default: 5,    min: 1, step: 1 },
    { key: 'propBet',     label: 'Prop Bet ($)',     type: 'number',  default: 5,    min: 1, step: 1 },
    { key: 'includePass', label: 'Include Pass Line', type: 'boolean', default: true },
  ],
  'Press & Regress (6/8)': [
    { key: 'baseBet',    label: 'Base Bet ($)',    type: 'number', default: 30, min: 6,  step: 6 },
    { key: 'pressedBet', label: 'Pressed Bet ($)', type: 'number', default: 60, min: 12, step: 6 },
  ],
  'Place 6 & 8 - Press 1 Unit': [
    { key: 'baseBet', label: 'Base Bet ($)', type: 'number', default: 30, min: 6, step: 6 },
    { key: 'unit',    label: 'Unit Size ($)', type: 'number', default: 30, min: 6, step: 6 },
  ],
  'Inside (5-6-8-9)': [
    { key: 'place59', label: 'Place 5/9 ($)', type: 'number', default: 0, min: 0, step: 5, description: '0 = use table minimum' },
    { key: 'place68', label: 'Place 6/8 ($)', type: 'number', default: 0, min: 0, step: 6, description: '0 = use table minimum × 1.2' },
  ],
  'Across (4-5-6-8-9-10)': [
    { key: 'place410', label: 'Place 4/10 ($)', type: 'number', default: 0, min: 0, step: 5, description: '0 = use table minimum' },
    { key: 'place59',  label: 'Place 5/9 ($)',  type: 'number', default: 0, min: 0, step: 5, description: '0 = use table minimum' },
    { key: 'place68',  label: 'Place 6/8 ($)',  type: 'number', default: 0, min: 0, step: 6, description: '0 = use table minimum × 1.2' },
  ],
  '6/8 Build → Across': [
    { key: 'base68', label: 'Base 6/8 Bet ($)', type: 'number', default: 30, min: 6, step: 6 },
  ],
  // Strategies with no configurable params
  'Casino Points':           [],
  'Come Ladder (7-unit)':    [],
  'Across → Infinity Come':  [],
  'Infinite Molly':          [],
};
