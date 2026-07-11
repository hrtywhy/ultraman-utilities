import React, { useEffect, useState } from 'react';
import { ToastProvider } from './lib/toast';
import { ToolCard } from './components/ToolCard';
import { IpSearch } from './tools/IPSearch';
import { HashSearch } from './tools/HashSearch';
import { DomainSearch } from './tools/DomainSearch';
import { MacVendorLookup } from './tools/MacVendorLookup';
import { Defang } from './tools/Defang';
import { SafelinkDecoder } from './tools/SafelinkDecoder';
import { QrDecoder } from './tools/QrDecoder';
import { WhoisSearch } from './tools/WhoisSearch';
import { Base64Decoder } from './tools/Base64Decoder';
import { RemoteFileFinder } from './tools/RemoteFileFinder';

const TOOLS = [
  { id: 'ipsearch', title: 'IP Search', desc: 'Full IP triage report — geolocation, reputation, VPN/proxy, and more.', live: true, Comp: IpSearch },
  { id: 'hashsearch', title: 'Hash Search', desc: 'Build lookup links for VirusTotal, Hybrid Analysis, Joe Sandbox.', Comp: HashSearch },
  { id: 'domainsearch', title: 'Domain Search', desc: 'Live domain triage across urlscan.io, VirusTotal, OTX, and more.', live: true, Comp: DomainSearch },
  { id: 'macvendor', title: 'MAC Vendor Lookup', desc: 'Resolve a MAC address to its hardware vendor.', live: true, Comp: MacVendorLookup },
  { id: 'defang', title: 'Defang / Refang', desc: 'Neutralize or restore IPs, URLs, and emails.', Comp: Defang },
  { id: 'safelink', title: 'Safelink Decoder', desc: 'Unwrap Outlook Safelinks and similar redirect URLs.', Comp: SafelinkDecoder },
  { id: 'qr', title: 'QR Decoder', desc: 'Decode a QR code from an uploaded image or an image URL.', Comp: QrDecoder },
  { id: 'whois', title: 'WHOIS Search', desc: 'Build a WHOIS lookup link for a domain or IP.', Comp: WhoisSearch },
  { id: 'base64', title: 'Base64 Decoder', desc: 'Decode Base64 with UTF-16LE, UTF-8, and hex fallback.', Comp: Base64Decoder },
  { id: 'findcmd', title: 'Remote File Finder', desc: 'Generate a find / Get-ChildItem command for a target host.', Comp: RemoteFileFinder },
];

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.className = 'theme-' + theme;
  }, [theme]);

  return (
    <ToastProvider>
      <button className="theme-fab" aria-label="Toggle dark or light theme" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
        {theme === 'dark' ? '🌙' : '☀️'}
      </button>
      <button className="hamburger-btn" aria-label="Open menu" onClick={() => setSidebarOpen((o) => !o)}>☰</button>
      <div className={'sidebar-backdrop' + (sidebarOpen ? ' open' : '')} onClick={() => setSidebarOpen(false)} />

      <div className="shell">
        <nav className={'sidebar' + (sidebarOpen ? ' open' : '')}>
          <div className="logo">
            <img className="logo-mark" src="/skyshield-logo.png" alt="Skyshield Labs shield" />
            <div className="logo-name">Ultraman Utilities</div>
          </div>
          <div className="logo-sub">Tools for Ultraman Work</div>

          <ul className="nav-list">
            {TOOLS.map((t, i) => (
              <a
                key={t.id}
                className="nav-item"
                href={`#${t.id}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-num">{String(i + 1).padStart(2, '0')}</span>
                {t.title}
              </a>
            ))}
          </ul>
        </nav>

        <main className="main">
          {TOOLS.map((t, i) => (
            <ToolCard key={t.id} id={t.id} num={String(i + 1).padStart(2, '0')} title={t.title} desc={t.desc} live={t.live}>
              <t.Comp />
            </ToolCard>
          ))}
        </main>
      </div>
    </ToastProvider>
  );
}
