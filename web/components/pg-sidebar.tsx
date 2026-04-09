import Link from "next/link";

type LinkItem = { label: string; url: string };

interface Props {
  username: string;
  isCustomDomain: boolean;
  links: LinkItem[];
}

const btn: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "2px 6px",
  background: "linear-gradient(to bottom, #7878ac 0%, #66669a 100%)",
  color: "#ffffff",
  fontSize: "11px",
  fontFamily: "Verdana, Geneva, sans-serif",
  fontWeight: "bold",
  textDecoration: "none",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  border: "1px outset #5858a0",
  marginBottom: "-1px",
  borderTop: "2px groove #d8d8ee",
  borderBottom: "2px groove #3a3a70",
  textShadow: "-1px -1px 0 rgba(0,0,0,0.35), 1px 1px 0 rgba(255,255,255,0.08)",
  letterSpacing: "0.01em",
};

export function PgSidebar({ username, isCustomDomain, links }: Props) {
  const homeHref = isCustomDomain ? "/" : `/${username}`;
  const items = [
    { label: "Home",   href: homeHref,  external: false },
    { label: "Essays", href: homeHref,  external: false },
    ...links.map((l) => ({ label: l.label, href: l.url, external: true })),
  ];

  return (
    <div className="pg-sidebar">
      {items.map(({ label, href, external }) =>
        external ? (
          <a key={href + label} href={href} target="_blank" rel="noopener noreferrer" style={btn}>
            {label}
          </a>
        ) : (
          <Link key={label} href={href} style={btn}>
            {label}
          </Link>
        )
      )}
    </div>
  );
}
