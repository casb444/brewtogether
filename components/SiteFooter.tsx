const COLUMNS = [
  {
    title: "Product",
    links: [
      ["The Café", "/cafe/main"],
      ["Study groups", "/groups"],
      ["Support", "/support"],
    ],
  },
  {
    title: "Trust",
    links: [
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["Community", "/community"],
    ],
  },
];

export function SiteFooter({
  donationUrl,
  roomLinks = [],
}: {
  donationUrl?: string;
  roomLinks?: [string, string][];
}) {
  return (
    <footer className="bg-ink text-white/50 px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
      <div className="col-span-2 sm:col-span-1">
        <div className="font-display italic text-lg text-white/85 mb-1.5">brewtogether</div>
        <div className="text-xs text-white/35 italic">everyone here is a stranger — and that&apos;s the point</div>
      </div>
      {COLUMNS.map((column) => (
        <div key={column.title}>
          <div className="text-[11px] uppercase tracking-wider text-white/35 mb-3">{column.title}</div>
          {column.links.map(([label, href]) => (
            <a key={label} href={href} className="text-[13px] text-white/50 hover:text-white/85 transition-colors block mb-2">
              {label}
            </a>
          ))}
        </div>
      ))}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-white/35 mb-3">{roomLinks.length ? "Rooms" : "Contact"}</div>
        {(roomLinks.length ? roomLinks : [["Email", "mailto:hi@brewtogether.app"]]).map(([label, href]) => (
          <a key={label} href={href} className="text-[13px] text-white/50 hover:text-white/85 transition-colors block mb-2">
            {label}
          </a>
        ))}
        {donationUrl ? (
          <a href={donationUrl} className="text-[13px] text-white/50 hover:text-white/85 transition-colors block mb-2">
            Donate
          </a>
        ) : null}
      </div>
    </footer>
  );
}
