# Forward Deployed Engineer (FDE) flashcard decks — plan

Owner's request (7 Oct 2026): make flashcards for every tool an FDE needs, basic to advanced, "100%". This file is the plan. Build status is kept at the bottom.

## Rules for every deck (decided, do not undo)

- **Written in English.** Commands and code stay as they are (see `docs/PROJECT-MEMORY.md`).
- **Same card as before:** the 56-point three-side card made by the flashcard-maker skill (Recognition, Understanding, Practice). Concept cards use `topic56`, command and code cards use `code56`.
- **Code is not run.** Bash, TypeScript, YAML and Python-library snippets are only structure-checked by the audit. Try them on a test machine before trusting them.
- **No prices, quotas or version numbers** that change often. Where a fact depends on a vendor or plan, the card says so and points to the docs.
- **Already made, so not repeated here:** GitHub (66), Power BI (58), API Integration (52), Supabase (52), and the Python and SQL decks from earlier chats (see `docs/flashcard-library-plan.md`).
- "100%" means every topic below is covered from basic to advanced. It cannot mean every possible fact about a tool, so each deck lists what is left out.

## The 16 decks (about 650 cards)

| # | Deck | ID prefix | Cards |
|---|---|---|---|
| 1 | Linux and the command line | LNX | 56 |
| 2 | Docker | DKR | 50 |
| 3 | Cloud basics (AWS-led, Azure and GCP mapped) | CLD | 50 |
| 4 | CI/CD | CICD | 40 |
| 5 | Networking basics | NET | 45 |
| 6 | JavaScript and TypeScript | TS | 60 |
| 7 | ETL and data pipelines | ETL | 40 |
| 8 | Airflow | AIR | 35 |
| 9 | Kubernetes | K8S | 45 |
| 10 | Logging and monitoring (observability) | OBS | 35 |
| 11 | SSO and identity | SSO | 30 |
| 12 | LLM APIs | LLM | 45 |
| 13 | RAG | RAG | 40 |
| 14 | AI evaluation | EVL | 30 |
| 15 | Jupyter Notebook | JUP | 25 |
| 16 | Requirements, documentation and customer work | REQ | 30 |

Build order is the table order: the tools an FDE meets first on a customer machine come first.

## Card lists

### 1. Linux and the command line (LNX, 56)
- **Basics (6):** what Linux is and distributions, shell vs terminal, file system layout, absolute vs relative paths, `man` and `--help`, package managers.
- **Files and folders (9):** `ls`, `cd` and `pwd`, `mkdir`, `cp` `mv` `rm`, `touch` and file types, `cat` `less` `head` `tail`, `find`, wildcards, hard and soft links.
- **Text tools (9):** `grep`, `sed`, `awk`, `cut` `sort` `uniq`, `wc`, `tr`, pipes, redirection, `xargs`.
- **Users and permissions (7):** users and groups, read write execute bits, `chmod`, `chown`, `sudo`, `umask`, SSH key file permissions.
- **Processes and system (8):** `ps` and `top`, signals and `kill`, background jobs and `nohup`, `systemctl`, `journalctl`, `cron`, `df` and `du`, memory with `free`.
- **Network tools (6):** `ping`, `curl` and `wget`, `ssh` `scp` `rsync`, `ss`, `ip`, `dig`.
- **Bash scripting (8):** shebang, variables, conditions, loops, functions, exit codes, `set -euo pipefail`, environment variables and `PATH`.
- **Advanced (3):** `tmux`, `lsof` and `strace`, `tar` and `gzip`.

### 2. Docker (DKR, 50)
- **Basics (5):** containers vs virtual machines, images vs containers, engine and CLI, registries and Docker Hub, tags and digests.
- **Dockerfile (11):** `FROM`, `RUN`, `COPY` vs `ADD`, `WORKDIR`, `CMD` vs `ENTRYPOINT`, `ENV` and `ARG`, `EXPOSE`, layers and cache, `.dockerignore`, multi-stage builds, running as non-root.
- **CLI (8):** `docker run` options, `ps`, `logs`, `exec`, `stop` and `rm`, `images` `pull` `push`, `tag`, `build`.
- **Storage and networking (8):** volumes, bind mounts, tmpfs, bridge network, port mapping, container DNS, host network, network troubleshooting.
- **Compose (8):** `docker-compose.yml`, services, networks and volumes, `depends_on` and health checks, env files, profiles, override files, useful commands.
- **Security and operations (6):** image scanning, secrets, resource limits, health checks, log drivers, cleaning up space.
- **Advanced (4):** BuildKit, multi-platform images, debugging a failing container, Docker in CI.

### 3. Cloud basics (CLD, 50) — AWS names first, Azure and GCP equivalents in each card
- **Basics (6):** IaaS PaaS SaaS, regions and availability zones, shared responsibility, pay-as-you-go, cloud vs on-premises, well-architected ideas.
- **Identity (6):** IAM users, groups, roles and policies, least privilege, MFA, access keys, temporary credentials.
- **Compute (7):** virtual machines (EC2), images, instance types, key pairs, auto scaling, serverless functions (Lambda), containers services (ECS, Fargate).
- **Storage (6):** object storage (S3), buckets and policies, storage classes, presigned URLs, block storage, file storage.
- **Networking (8):** VPC, subnets, route tables, internet and NAT gateways, security groups vs network ACLs, load balancers, DNS (Route 53), CDN.
- **Data (5):** managed relational databases, NoSQL, caching, backups and snapshots, queues and topics (SQS, SNS).
- **Operations (7):** monitoring (CloudWatch), logging, infrastructure as code (CloudFormation, Terraform), tagging, cost alerts, secrets and KMS, regions and disaster recovery.
- **Mapping (3):** AWS vs Azure vs GCP service map, choosing a cloud, leaving no resource behind (cleanup).
- **Left out:** vendor pricing, certification exam details.

### 4. CI/CD (CICD, 40)
- **Ideas (6):** CI vs delivery vs deployment, pipeline stages, triggers, build artifacts, environments, DORA metrics.
- **GitHub Actions (10):** workflow file, jobs and steps, runners, `matrix`, caching, artifacts, secrets, environments and approvals, reusable workflows, permissions.
- **Quality gates (6):** unit and integration tests, linting and formatting, security scans, code coverage, required checks, flaky tests.
- **Deployment (9):** rolling, blue-green, canary, rollbacks, feature flags, database migrations, GitOps, infrastructure as code in pipelines, release tagging.
- **Security and scale (5):** OIDC to the cloud, pinning actions, least privilege tokens, secret scanning, self-hosted runners.
- **Mapping (4):** Jenkins, GitLab CI, Azure Pipelines vs GitHub Actions, choosing a tool.

### 5. Networking basics (NET, 45)
- **Models (4):** OSI and TCP/IP layers, packets and frames, client and server, latency vs bandwidth.
- **Addressing (8):** IPv4, IPv6, subnets and CIDR, private vs public IPs, ports, NAT, DHCP, MAC and ARP.
- **Protocols (9):** TCP vs UDP, TCP handshake, DNS and record types, HTTP, HTTPS and TLS, certificates, HTTP/2 and HTTP/3, WebSockets, SMTP and email basics.
- **Devices and paths (7):** routers and switches, firewalls, proxies and reverse proxies, load balancers (layer 4 vs 7), VPN, CDN, gateways.
- **Security (5):** zero trust, TLS inspection, allow-lists, bastion hosts, SSH tunnels.
- **Troubleshooting (12):** method, `ping`, `traceroute`, `dig`, `curl -v`, `ss`, `tcpdump`, Wireshark basics, MTU, timeouts vs refused, DNS caching, proxy problems.

### 6. JavaScript and TypeScript (TS, 60)
- **JavaScript core (14):** `let` `const`, types, functions and arrows, scope, closures, `this`, arrays (`map` `filter` `reduce`), objects, destructuring and spread, modules, template strings, equality, truthiness, errors.
- **Async (8):** callbacks, promises, `async` and `await`, `fetch`, `try` and `catch`, event loop, `Promise.all`, timers.
- **Node and tooling (7):** Node.js, npm and `package.json`, scripts, environment variables, file system, ES modules vs CommonJS, a simple HTTP server.
- **TypeScript (20):** why TS, basic types, interfaces vs types, unions and literals, generics, narrowing, `any` vs `unknown`, optional and readonly, enums, `tsconfig`, utility types (`Partial` `Pick` `Omit` `Record`), `Promise<T>`, assertions, declaration files, type guards, strict mode, mapped types, `as const`, async typing, errors.
- **React basics (8):** components, JSX, props, state, `useEffect`, lists and keys, conditional rendering, fetching data.
- **Left out:** framework internals, bundler configuration details.

### 7. ETL and data pipelines (ETL, 40)
- **Ideas (6):** ETL vs ELT, sources and targets, batch vs streaming, warehouse vs lake vs lakehouse, pipelines vs jobs, data contracts.
- **Extract (6):** from APIs, databases and files, full vs incremental loads, change data capture, pagination and rate limits, credentials.
- **Transform (8):** cleaning, types and nulls, joins, deduplication, aggregations, date handling, SQL transforms, dbt basics.
- **Load (5):** upserts, partitions, file formats (CSV, JSON, Parquet), schemas, schema changes.
- **Reliability (9):** idempotency, retries, logging, backfills, data quality checks, lineage, alerts, testing pipelines, error handling.
- **Advanced (6):** Kafka basics, orchestration, PII and masking, slowly changing data, cost and performance, late-arriving data.

### 8. Airflow (AIR, 35)
- **Basics (7):** what Airflow is, DAGs, tasks and operators, schedules and cron, dependencies, the web UI, components (scheduler, workers, metadata database).
- **Writing DAGs (10):** `DAG` definition, `PythonOperator` and `BashOperator`, TaskFlow API, XCom, templating, variables, connections and hooks, sensors, branching, task groups.
- **Running (8):** data intervals, catchup and backfill, retries and timeouts, pools and concurrency, executors, triggers, SLAs, dynamic task mapping.
- **Operations (6):** deployment options, logs, testing DAGs, secrets backends, alerts, upgrades.
- **Best practice (4):** idempotent tasks, small tasks, no heavy work in DAG files, passing data by reference.

### 9. Kubernetes (K8S, 45)
- **Architecture (6):** why Kubernetes, control plane, nodes, `kubectl`, clusters and contexts, managed offerings.
- **Workloads (9):** pods, ReplicaSets, Deployments, StatefulSets, DaemonSets, Jobs and CronJobs, labels and selectors, namespaces, rolling updates and rollbacks.
- **Config and storage (6):** ConfigMaps, Secrets, volumes, PersistentVolumes and claims, storage classes, environment variables.
- **Networking (6):** Services (ClusterIP, NodePort, LoadBalancer), Ingress, DNS in the cluster, network policies, ports and probes, service mesh idea.
- **Reliability (7):** liveness and readiness probes, requests and limits, autoscaling, taints and tolerations, affinity, disruption budgets, quotas.
- **Security (4):** RBAC, service accounts, pod security, image pull secrets.
- **Tooling (7):** Helm, Kustomize, debugging with `describe` and `logs`, `exec`, port-forward, events, common failures (CrashLoopBackOff, ImagePullBackOff).

### 10. Logging and monitoring (OBS, 35)
- **Ideas (5):** logs vs metrics vs traces, monitoring vs observability, health checks, dashboards, alerts.
- **Logging (8):** log levels, structured logs, correlation ids, central logging, retention, sensitive data in logs, sampling, searching logs.
- **Metrics (7):** counters gauges histograms, Prometheus basics, Grafana basics, RED and USE methods, cardinality, percentiles, saturation.
- **Tracing (4):** spans and traces, OpenTelemetry, propagation, sampling.
- **Reliability practice (8):** SLI SLO SLA, error budgets, alert fatigue, on-call, runbooks, incident response, postmortems, status pages.
- **Cost and quality (3):** cost of telemetry, log pipelines, testing alerts.

### 11. SSO and identity (SSO, 30)
- **Basics (6):** authentication vs authorisation, identity provider vs service provider, what SSO is, MFA, sessions, directory services (LDAP, Active Directory).
- **Protocols (10):** SAML flow and assertions, OAuth 2.0 grants, OpenID Connect and ID tokens, PKCE, scopes and claims, JWT validation, token lifetimes, refresh tokens, client credentials, redirect URI rules.
- **Provisioning and access (6):** SCIM, groups and roles, RBAC vs ABAC, service accounts, just-in-time provisioning, offboarding.
- **Operations and security (8):** single logout, certificate rotation, clock skew, common attacks (CSRF, token theft), passkeys, mTLS, debugging a failed login, vendor setup checklist.

### 12. LLM APIs (LLM, 45)
- **Basics (7):** what an LLM is, tokens, context window, roles, temperature and sampling, stop reasons, model choice.
- **Prompting (8):** instructions, examples, structure with delimiters, step-by-step reasoning, output format, system prompts, prompt versions, common mistakes.
- **API use (10):** a request and response, streaming, structured output, tool calling, errors and retries, rate limits, timeouts, batching, caching, cost control.
- **Quality and safety (8):** hallucination, grounding, prompt injection, data privacy, moderation, guardrails, human review, logging calls safely.
- **Applications (8):** chat memory, summarising, extraction, classification, agents and loops, MCP idea, multimodal input, fallbacks.
- **Left out:** specific model names, prices and limits, because they change.
- **Note:** check the current provider documentation before writing any example against a real API.

### 13. RAG (RAG, 40)
- **Ideas (5):** what RAG is, RAG vs fine-tuning vs long context, pipeline overview, when RAG fails, build vs buy.
- **Ingestion (9):** loading documents, parsing PDFs and OCR, cleaning, chunking, chunk size and overlap, metadata, embeddings, updating the index, deleting data.
- **Retrieval (10):** vector search, cosine similarity, `pgvector`, indexes (HNSW), top-k, filters, hybrid search, reranking, query rewriting, multi-query.
- **Generation (6):** building the prompt, citations, handling no answer, context limits, faithfulness, answer style.
- **Operations (10):** access control per user, multi-tenant data, freshness, caching, latency and cost, monitoring, evaluating retrieval, failure analysis, agentic RAG, graph-based retrieval.

### 14. AI evaluation (EVL, 30)
- **Ideas (5):** why evaluate, offline vs online, test sets, regression tests, what good means.
- **Methods (10):** golden datasets, rubrics, exact match and similarity, precision and recall, LLM-as-judge and its biases, human review and agreement, pairwise comparison, A/B tests, sampling, statistical care.
- **RAG and agents (6):** retrieval metrics, faithfulness, answer relevance, tool-call accuracy, task success, cost and latency.
- **Safety and robustness (5):** red teaming, edge cases, prompt injection tests, bias checks, refusal quality.
- **Practice (4):** eval harness, prompt and model versioning, drift monitoring, feedback loops.

### 15. Jupyter Notebook (JUP, 25)
- **Basics (6):** what Jupyter is, cells, kernels, running order and state, Notebook vs JupyterLab, Colab and hosted options.
- **Daily use (8):** shortcuts, markdown cells, magic commands, displaying data, plotting inline, installing packages, virtual environments, restarting and running all.
- **Good practice (7):** reproducibility, secrets in notebooks, version control and clean outputs, converting with `nbconvert`, sharing, parameterised notebooks, notebook to script.
- **Advanced (4):** widgets, remote kernels, performance and memory, testing notebook code.

### 16. Requirements, documentation and customer work (REQ, 30)
- **The role (4):** what an FDE does, FDE vs solutions engineer vs support, success measures, working with product and engineering teams.
- **Discovery (7):** discovery calls, good questions, the five whys, stakeholder map, scoping, MVP, success criteria.
- **Requirements (6):** user stories, acceptance criteria, prioritising (MoSCoW), assumptions and risks, change requests, estimating.
- **Documentation (6):** README, technical spec, runbook, decision log, meeting notes, handover document.
- **Communication (7):** demos, status updates, saying no, bad news, expectation setting, working on site and remotely, security and data questions from customers.

## Status (updated as decks are finished)

| Deck | State |
|---|---|
| Plan | Saved 7 Oct 2026 |
| 1 Linux (56) | Built, audited (0 errors, 0 warnings), delivered in chat |
| 2 Docker (50) | Built, audited, delivered in chat |
| 3 Cloud basics (50) | Built, audited, delivered in chat |
| 4 CI/CD (40) | Built, audited, delivered in chat |
| 5 Networking (45) | Built, audited, delivered in chat |
| 6 JavaScript and TypeScript (60) | Built, audited, delivered in chat |
| 7 ETL and data pipelines (40) | Built, audited, delivered in chat |
| 8 Airflow (35) | Built, audited, delivered in chat |
| 9 Kubernetes (45) | Built, audited, delivered in chat |
| 10 Logging and monitoring (35) | Built, audited, delivered in chat |
| 11 SSO and identity (30) | Built, audited, delivered in chat |
| 12 LLM APIs (45) | Built, audited, delivered in chat (generic API placeholders, no model names or prices) |
| 13 RAG (40) | Built, audited, delivered in chat |
| 14 AI evaluation (30) | Built, audited, delivered in chat |
| 15–16 | Not started yet: JUP, REQ |

Finished decks are delivered in the chat as an Excel workbook, two Anki files and a preview page. The card source text files live only in the chat session's scratch folder, so they are not in the repository yet. Code in cards is never run by the audit for non-Python decks.
