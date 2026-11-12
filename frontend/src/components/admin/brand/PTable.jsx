/**
 * Figma ki saaf table (Brand CRM / Messaging): header 10px caps, rows ~57px, beech mein patli line.
 * cols: [{ label, w }]  (w = column width, jaise "24%")
 * rows: [[cell, cell, …]]  — cell koi bhi JSX
 * Mobile par table apni jagah side-scroll hoti hai (page nahi).
 */
export default function PTable({ cols, rows, empty, rowH = 57, minW = 640, className = "" }) {
  return (
    <div className={`pt-wrap ${className}`} data-scroll>
      <table className="pt" style={{ minWidth: minW }}>
        <colgroup>
          {cols.map((c, i) => (
            <col key={i} style={c.w ? { width: c.w } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={i}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((r, i) => (
              <tr key={i} style={{ height: rowH }}>
                {r.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr style={{ height: rowH }}>
              <td colSpan={cols.length} className="pt-empty">
                {empty || "Nothing here yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <style>{`
        .pt-wrap { width: 100%; overflow-x: auto; scrollbar-width: thin; }
        .pt { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 13px; }
        .pt th {
          height: 41px; padding: 0 11px; text-align: left; vertical-align: middle; border-bottom: 1px solid var(--ad-line);
          font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #9aa2b4; white-space: nowrap;
        }
        .pt td { padding: 0 11px; border-bottom: 1px solid var(--ad-line); vertical-align: middle; color: var(--ad-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pt td .ad-badge { height: 24px; }
        .pt tbody tr:last-child td { border-bottom: 0; }
        .pt-empty { text-align: center; color: var(--ad-muted); }
        .pt b { font-weight: 700; }
        .pt-link { font-weight: 800; color: #6151ea; border: 0; background: none; padding: 0; font-size: 13px; }
        .pt-link:hover { color: var(--ad-primary-2); }
      `}</style>
    </div>
  );
}
