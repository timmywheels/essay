export function PgWatermark({ name }: { name: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        fontFamily: "Verdana, Geneva, sans-serif",
        fontSize: "clamp(22px, 5.5vw, 54px)",
        fontWeight: "500",
        letterSpacing: "0.35em",
        color: "#f8f8fd",
        textTransform: "uppercase",
        userSelect: "none",
        pointerEvents: "none",
        lineHeight: 1,
        paddingLeft: "24px",
        paddingRight: "24px",
        marginBottom: "-4px",
      }}
    >
      {name}
    </div>
  );
}
