#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://localhost:3000}"

pass() { echo "PASS  $*"; }
fail() { echo "FAIL  $*"; exit 1; }

_curl() {
  curl -sS -o /tmp/md_body -D /tmp/md_headers -w "%{http_code}" "$@"
}

# ---------------------------------------------------------------------------
# /llms.txt: single root index per https://llmstxt.org.
# ---------------------------------------------------------------------------
check_llms_txt() {
  local code
  code=$(_curl "$BASE/llms.txt")
  [[ "$code" == "200" ]] || fail "/llms.txt: expected 200, got $code"
  grep -qiE "^content-type: text/plain" /tmp/md_headers \
    || fail "/llms.txt: expected text/plain"
  grep -qE "^# " /tmp/md_body \
    || fail "/llms.txt: missing H1 per spec"
  grep -qE "^> " /tmp/md_body \
    || fail "/llms.txt: missing blockquote summary per spec"
  grep -qE "^## Blog\b" /tmp/md_body \
    || fail "/llms.txt: missing '## Blog' section"
  grep -qE "^## Projects\b" /tmp/md_body \
    || fail "/llms.txt: missing '## Projects' section"
  pass "/llms.txt spec shape"
}
check_llms_txt

# ---------------------------------------------------------------------------
# Per-page markdown via Accept: text/markdown (Proxy rewrite -> /api/md).
# ---------------------------------------------------------------------------
check_first_line() {
  local path="$1" expect="$2"
  local got
  got=$(curl -sS -L -H "Accept: text/markdown" "$BASE$path" | head -1)
  [[ "$got" == "$expect" ]] \
    && pass "first-line $path" \
    || fail "first-line $path\n  expected: $expect\n  got:      $got"
}

check_first_line "/en"                                                "# Chen Xiang (陈想)"
check_first_line "/blog"                                              "# Blog"
check_first_line "/project"                                           "# Projects"
check_first_line "/blog/deploy-full-stack-nitro-apps-to-azure-swa"    "# Deploy Full Stack Nitro Apps to Azure SWA"

check_markdown_headers() {
  local path="$1"
  local code
  code=$(_curl -H "Accept: text/markdown" "$BASE$path")
  [[ "$code" == "200" ]] || fail "headers $path: expected 200, got $code"
  grep -qiE "^content-type: text/markdown" /tmp/md_headers \
    || fail "headers $path: missing Content-Type: text/markdown"
  grep -qiE "^vary:.*accept" /tmp/md_headers \
    || fail "headers $path: missing Vary: Accept"
  grep -qiE "^x-markdown-tokens: [0-9]+" /tmp/md_headers \
    || fail "headers $path: missing x-markdown-tokens"
  pass "headers $path"
}

check_markdown_headers "/en"
check_markdown_headers "/blog"
check_markdown_headers "/project"
check_markdown_headers "/blog/deploy-full-stack-nitro-apps-to-azure-swa"

# ---------------------------------------------------------------------------
# HTML passthrough: no Accept -> HTML, not markdown.
# ---------------------------------------------------------------------------
check_html_passthrough() {
  local path="$1"
  local code
  code=$(_curl -L "$BASE$path")
  [[ "$code" == "200" ]] || fail "html $path: expected 200, got $code"
  grep -qiE "^content-type: text/html" /tmp/md_headers \
    || fail "html $path: expected text/html"
  pass "html $path"
}

check_html_passthrough "/"
check_html_passthrough "/blog"
check_html_passthrough "/project"

# ---------------------------------------------------------------------------
# 404 for unknown markdown paths. Must not silently return home content.
# ---------------------------------------------------------------------------
check_markdown_404() {
  local path="$1"
  local code
  code=$(_curl -H "Accept: text/markdown" "$BASE$path")
  [[ "$code" == "404" ]] \
    || fail "404 $path: expected 404, got $code"
  pass "404 $path"
}
check_markdown_404 "/blog/this-slug-definitely-does-not-exist-xyz"

# ---------------------------------------------------------------------------
# Low q-value on text/markdown should serve HTML, not markdown.
# ---------------------------------------------------------------------------
check_qvalue_prefers_html() {
  local code
  code=$(_curl -H "Accept: text/html;q=1.0, text/markdown;q=0.1" "$BASE/")
  [[ "$code" == "200" ]] || fail "qvalue: expected 200, got $code"
  grep -qiE "^content-type: text/html" /tmp/md_headers \
    || fail "qvalue: html>markdown should return HTML"
  pass "qvalue html>markdown"
}
check_qvalue_prefers_html

echo
echo "All checks passed."
