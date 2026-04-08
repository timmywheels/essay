export const runtime = "edge";

const SCRIPT = `#!/bin/sh
set -e

REPO="timmywheels/essay"
BIN="essay"
INSTALL_DIR="$HOME/.local/bin"

# Detect OS
OS="$(uname -s)"
case "$OS" in
  Linux)  OS="linux" ;;
  Darwin) OS="darwin" ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

# Detect arch
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64)  ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *)
    echo "Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

# Get latest release version
VERSION="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | sed 's/.*"tag_name": *"\\([^"]*\\)".*/\\1/')"

if [ -z "$VERSION" ]; then
  echo "Failed to fetch latest version"
  exit 1
fi

FILENAME="\${BIN}_\${OS}_\${ARCH}.tar.gz"
URL="https://github.com/$REPO/releases/download/$VERSION/$FILENAME"

echo "Installing essay $VERSION ($OS/$ARCH)..."

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

curl -fsSL "$URL" -o "$TMP/$FILENAME"
tar -xzf "$TMP/$FILENAME" -C "$TMP"

mkdir -p "$INSTALL_DIR"
mv "$TMP/$BIN" "$INSTALL_DIR/$BIN"
chmod +x "$INSTALL_DIR/$BIN"

echo ""
echo "essay installed to $INSTALL_DIR/essay"
echo ""

# Check if INSTALL_DIR is in PATH
case ":$PATH:" in
  *":$INSTALL_DIR:"*) ;;
  *)
    echo "Add this to your shell profile (~/.zshrc or ~/.bashrc):"
    echo ""
    echo "  export PATH=\"\\$PATH:$INSTALL_DIR\""
    echo ""
    ;;
esac

echo "Get started:"
echo ""
echo "  essay auth"
echo ""
`;

export async function GET() {
  return new Response(SCRIPT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
