---
name: Org Aliases and Purposes
description: Known authenticated Salesforce org aliases and their usernames/purposes for this project
type: project
---

Current connected org: **claudepoc** (`epic.119e1776444921141@orgfarm.salesforce.com`, Org ID: `00Dd200000gzd13EAA`, instance: `orgfarm-24648c233d-dev-ed.develop.my.salesforce.com`). This is a persistent org (not a scratch org), not expired.

Previous default scratch org `sfclaudedemo` (`prasanthi.kandula@playful-bear-k7lk2a.com`) is no longer available — it does not appear in `sf org list`.

**Why:** The sfclaudedemo scratch org expired or was deleted. claudepoc is the only authenticated org as of 2026-05-07.

**How to apply:** When the user asks to deploy without specifying a target org, use `epic.119e1776444921141@orgfarm.salesforce.com` (alias `claudepoc`). Always confirm before deploying if a different org is expected.
