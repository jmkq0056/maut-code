#!/usr/bin/env bash
# Maut code is now Dovo. This forwards to Dovo's installer, which moves your Maut code settings
# and extensions over and retires the old app.
set -euo pipefail
printf '\n  Maut code is now Dovo. Installing Dovo...\n'
curl -fsSL https://jmkq0056.github.io/dovo/install.sh | bash
