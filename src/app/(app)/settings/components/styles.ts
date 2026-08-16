export function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: '100%',
    height: 40,
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    backgroundColor: 'var(--bg-surface)',
    border: `${focused ? 2 : 1}px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
    padding: '0 12px',
    color: 'var(--text-primary)',
    borderRadius: 0,
    outline: 'none',
  }
}

export function primaryButtonStyle(height: number, padding: string, disabled: boolean): React.CSSProperties {
  return {
    height,
    padding,
    border: 'none',
    borderRadius: 0,
    backgroundColor: disabled ? 'var(--bg-elevated)' : 'var(--accent)',
    color: disabled ? 'var(--text-dim)' : '#000',
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

export const ghostButtonStyle: React.CSSProperties = {
  height: 36,
  padding: '0 18px',
  border: '1px solid var(--border)',
  borderRadius: 0,
  backgroundColor: 'transparent',
  color: 'var(--text-secondary)',
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  cursor: 'pointer',
}

export const tableHeaderStyle: React.CSSProperties = {
  padding: '0 10px 8px',
  textAlign: 'left',
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.12em',
  color: 'var(--text-dim)',
  fontWeight: 400,
}

export const tableCellStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontFamily: "'DM Mono', monospace",
  fontSize: 13,
  color: 'var(--text-secondary)',
  verticalAlign: 'top',
}

export const emptyCellStyle: React.CSSProperties = {
  ...tableCellStyle,
  height: 44,
  color: 'var(--text-dim)',
}

export const pillStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  padding: '3px 10px',
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  color: 'var(--text-secondary)',
}

export function statusStyle(color: string): React.CSSProperties {
  return {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color,
    letterSpacing: '0.08em',
  }
}
