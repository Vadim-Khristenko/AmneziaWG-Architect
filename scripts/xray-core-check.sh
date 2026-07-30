#!/usr/bin/env bash
#
# Ask each released Xray-core whether it would load the configs generated for
# it. `xray run -test` parses the config and builds the instance without
# opening a socket, which is exactly the question — and it is a real check:
# of eight deliberately broken configs it rejects six, the two it accepts
# being documented core behaviour (a non-UUID id is hashed into one, and
# Vision without TLS is caught at handshake time rather than at load).
#
# Each version's configs run against that version's core. Running everything
# against one core is worse than useless: unknown keys are ignored, so a
# config naming a feature the core does not have passes anyway.
#
#   scripts/xray-core-check.sh <fixture-dir>
#
set -euo pipefail

FIXTURES="${1:?usage: xray-core-check.sh <fixture-dir>}"
FIXTURES="$(cd "$FIXTURES" && pwd)"

# Docker Desktop on Windows takes Windows paths; the Git Bash that runs this
# script hands out /c/… ones, and a mount with a path it cannot resolve comes
# up silently empty rather than failing. On Linux this is the identity.
host_path() {
  if command -v cygpath > /dev/null 2>&1; then
    cygpath -m "$1"
  else
    printf '%s' "$1"
  fi
}

# Versions the generator offers. Keep in step with src/engines/xray/versions.ts;
# the check below fails loudly if a fixture has no core to run against.
VERSIONS=(24.11.11 25.7.23 25.8.29 26.1.13 26.6.22 26.7.11)

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# The official images are distroless, so there is no shell to loop hundreds of
# configs in. Same binary and geo files, on a base that has one. The v24.11.11
# image keeps them under /usr; later releases moved to /usr/local.
build_image() {
  local version="$1" tag="$2" bin share
  if [ "$version" = "24.11.11" ]; then
    bin=/usr/bin/xray
    share=/usr/share/xray/
  else
    bin=/usr/local/bin/xray
    share=/usr/local/share/xray/
  fi

  cat > "$WORK/Dockerfile" <<EOF
FROM ghcr.io/xtls/xray-core:${version} AS core
FROM alpine:3.22
COPY --from=core ${bin} /usr/local/bin/xray
COPY --from=core ${share} /usr/local/share/xray/
ENV XRAY_LOCATION_ASSET=/usr/local/share/xray
ENTRYPOINT ["/bin/sh"]
EOF

  docker build -q -f "$(host_path "$WORK/Dockerfile")" -t "$tag" "$(host_path "$WORK")" > /dev/null
}

cat > "$WORK/run.sh" <<'EOF'
#!/bin/sh
version="$1"
pass=0
fail=0
for config in /cfg/${version}_*.json; do
  [ -e "$config" ] || continue
  if error=$(xray run -test -c "$config" 2>&1); then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    # The banner and the [Info] line are noise; the failure is the last line.
    reason=$(printf '%s' "$error" | grep -i 'failed to start' | tail -1)
    printf '  REJECTED %s\n    %s\n' "$(basename "$config" .json)" "$reason"
  fi
done
echo "RESULT ${version} pass=${pass} fail=${fail}"
EOF

total_fail=0
for version in "${VERSIONS[@]}"; do
  count=$(find "$FIXTURES" -name "${version}_*.json" | wc -l)
  if [ "$count" -eq 0 ]; then
    echo "no fixtures for ${version} — the version list and the generator disagree" >&2
    exit 1
  fi

  tag="awga-xray:${version}"
  build_image "$version" "$tag"

  echo "── core ${version} (${count} configs) ────────────────────────────────"
  # MSYS_NO_PATHCONV keeps Git Bash from rewriting the in-container paths
  # into Windows ones; it is ignored everywhere else.
  output=$(MSYS_NO_PATHCONV=1 docker run --rm \
    -v "$(host_path "$FIXTURES"):/cfg:ro" \
    -v "$(host_path "$WORK/run.sh"):/run.sh:ro" \
    "$tag" -c "sh /run.sh ${version}")
  echo "$output"

  failed=$(printf '%s' "$output" | sed -n "s/^RESULT ${version} pass=[0-9]* fail=//p")
  total_fail=$((total_fail + failed))
done

echo
if [ "$total_fail" -ne 0 ]; then
  echo "${total_fail} config(s) the core would refuse to load."
  exit 1
fi
echo "Every generated config loads on the core it was generated for."
