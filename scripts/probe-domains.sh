#!/usr/bin/env bash
#
# Ask a domain what it actually supports, rather than trusting a list.
#
# A REALITY donor has to speak TLS 1.3 and HTTP/2, and must not sit behind the
# same CDN as the server pretending to be it. A QUIC mimicry host has to speak
# HTTP/3 or the packets it is imitating do not exist. Published lists get all
# three wrong regularly — a site adds HTTP/3, moves behind Cloudflare, or drops
# TLS 1.2 — so the database is built from probes and re-probed when it matters.
#
#   scripts/probe-domains.sh domains.txt            # probe locally
#   scripts/probe-domains.sh domains.txt user@host  # probe from elsewhere
#
# Probing from elsewhere is the point when the answer depends on where you
# stand: a domain reachable from one country may not be from another, and a
# donor has to be reachable from where the *client* is.
#
# Output is TSV: host, tls13, h2, h3, cdn, ip.
set -uo pipefail

LIST="${1:?usage: probe-domains.sh <file-with-one-host-per-line> [user@host]}"
REMOTE="${2:-}"

# The probe itself, run wherever the answers are wanted from. Kept as one
# script so the local and remote paths cannot drift apart.
read -r -d '' PROBE <<'PROBE_EOF' || true
probe() {
  host="$1"
  [ -z "$host" ] && return
  case "$host" in \#*) return;; esac

  # ALPN is the direct question: h2 means HTTP/2, and the TLS version comes
  # back from the same handshake.
  info=$(curl -sI --max-time 8 --tlsv1.2 "https://${host}/" \
    -o /dev/null -w '%{http_version} %{ssl_verify_result}' 2>/dev/null)
  version=$(printf '%s' "$info" | cut -d' ' -f1)

  h2=no
  case "$version" in 2|3) h2=yes;; esac

  # TLS 1.3 is asked for explicitly: if the handshake completes with it
  # forced, the server has it.
  if curl -sI --max-time 8 --tlsv1.3 --tls-max 1.3 "https://${host}/" \
      -o /dev/null 2>/dev/null; then
    tls13=yes
  else
    tls13=no
  fi

  # HTTP/3 needs curl built with it; the caller checks that once up front.
  if curl -sI --max-time 8 --http3-only "https://${host}/" \
      -o /dev/null 2>/dev/null; then
    h3=yes
  else
    h3=no
  fi

  # Who is in front. A donor behind the same CDN as the server pretending to
  # be it is the classic REALITY misconfiguration.
  headers=$(curl -sI --max-time 8 "https://${host}/" 2>/dev/null)
  cdn=none
  printf '%s' "$headers" | grep -qi 'cf-ray\|server: *cloudflare' && cdn=cloudflare
  [ "$cdn" = none ] && printf '%s' "$headers" | grep -qi 'x-amz-cf-id\|server: *cloudfront' && cdn=cloudfront
  [ "$cdn" = none ] && printf '%s' "$headers" | grep -qi 'server: *ecacc\|akamai' && cdn=akamai
  [ "$cdn" = none ] && printf '%s' "$headers" | grep -qi 'server: *fastly\|x-served-by' && cdn=fastly

  ip=$(dig +short +time=3 +tries=1 A "$host" 2>/dev/null | grep -m1 '^[0-9]' || echo "")

  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$host" "$tls13" "$h2" "$h3" "$cdn" "${ip:-none}"
}

if ! curl --version | grep -q HTTP3; then
  echo "warning: curl here has no HTTP/3, every h3 reading will be 'no'" >&2
fi

printf 'host\ttls13\th2\th3\tcdn\tip\n'
while IFS= read -r line || [ -n "$line" ]; do
  probe "$(printf '%s' "$line" | tr -d '\r' | tr -d ' ')"
done
PROBE_EOF

if [ -n "$REMOTE" ]; then
  # The key is the caller's business; ssh config decides which one applies.
  ssh -o BatchMode=yes "$REMOTE" "bash -s" <<< "$PROBE" < "$LIST"
else
  bash -c "$PROBE" < "$LIST"
fi
