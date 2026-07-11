import React, { useState } from 'react';

export function ToolCard({
  id, num, title, desc, live, children,
}: {
  id: string; num: string; title: string; desc: string; live?: boolean; children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={'card' + (collapsed ? ' collapsed' : '')} id={id}>
      <div className="tool-head" onClick={() => setCollapsed((c) => !c)}>
        <span className="tool-num">{num}</span>
        <div className="tool-title-wrap">
          <div className="tool-title">
            {title}
            {live && <span className="chip chip-ok">live</span>}
          </div>
          <div className="tool-desc">{desc}</div>
        </div>
        <span className="chev">▾</span>
      </div>
      <div className="tool-body">
        <div className="tool-body-inner">{children}</div>
      </div>
    </div>
  );
}
