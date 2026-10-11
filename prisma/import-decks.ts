// Loads the subject flashcard decks in content/fde-flashcards (Linux, Docker,
// GitHub, Power BI, LLM APIs, …) into the library as published EduSarthi decks,
// so they appear on the Explore page grouped by subject.
//
// It reuses the admin Excel import (lib/xlsxCards to read and check, then
// lib/xlsxImport to save), so a deck loaded here is exactly what Admin → Import
// would make: owned by the site admin, public, approved, cards matched by ID.
// Safe to run again: the deck is found by its title and cards are upserted, so
// students' review progress is kept.
//
// It deliberately does NOT create an admin account. The decks belong to the
// existing admin, chosen by ADMIN_EMAIL or, failing that, the oldest admin.
// One deck that fails (for example a card ID already used elsewhere) is
// reported and skipped; the others still load.
//
// Run with:  npx tsx prisma/import-decks.ts

import { readFileSync } from "fs";
import { join } from "path";

import { prisma } from "@/lib/prisma";
import { parseCardsXlsx } from "@/lib/xlsxCards";
import { importDeck } from "@/lib/xlsxImport";

const ROOT = "content/fde-flashcards";

// The tag is the deck's subject on the Explore page. Kept to a few broad
// subjects so each one fills a row instead of twenty one-deck groups.
const DECKS: { dir: string; file: string; title: string; tag: string; description: string }[] = [
  { dir: "lnx", file: "Linux and Command Line Flashcards.xlsx", title: "Linux and the Command Line", tag: "infrastructure", description: "Files, text tools, permissions, processes, networking commands and Bash scripting, from first steps to advanced." },
  { dir: "dkr", file: "Docker Flashcards.xlsx", title: "Docker", tag: "infrastructure", description: "Images, Dockerfiles, the CLI, volumes, networks, Compose and running containers safely." },
  { dir: "k8s", file: "Kubernetes Flashcards.xlsx", title: "Kubernetes", tag: "infrastructure", description: "Pods, Deployments, Services, config, storage, reliability, security and everyday kubectl debugging." },
  { dir: "cicd", file: "CI-CD Flashcards.xlsx", title: "CI/CD", tag: "infrastructure", description: "Pipelines, GitHub Actions, quality gates, deployment strategies and pipeline security." },
  { dir: "cld", file: "Cloud Basics Flashcards.xlsx", title: "Cloud Basics", tag: "cloud and networking", description: "Identity, compute, storage, networking and operations, with AWS, Azure and GCP names side by side." },
  { dir: "net", file: "Networking Flashcards.xlsx", title: "Networking Basics", tag: "cloud and networking", description: "Addressing, protocols, devices, security and a step-by-step method for network troubleshooting." },
  { dir: "obs", file: "Logging and Monitoring Flashcards.xlsx", title: "Logging and Monitoring", tag: "cloud and networking", description: "Logs, metrics, traces, alerts, SLOs and incident practice." },
  { dir: "sso", file: "SSO and Identity Flashcards.xlsx", title: "SSO and Identity", tag: "cloud and networking", description: "SAML, OAuth 2.0, OpenID Connect, tokens, provisioning and debugging a failed login." },
  { dir: "ts", file: "JavaScript and TypeScript Flashcards.xlsx", title: "JavaScript and TypeScript", tag: "programming", description: "JavaScript core, async code, Node tooling, TypeScript types and React basics." },
  { dir: "api", file: "API Integration Flashcards.xlsx", title: "API Integration", tag: "programming", description: "HTTP, REST, authentication, errors, retries, webhooks and testing an integration." },
  { dir: "en", file: "GitHub Flashcards English.xlsx", title: "GitHub", tag: "programming", description: "Git basics to advanced: branches, merging, pull requests, Actions, releases and fixing mistakes." },
  { dir: "sup", file: "Supabase Flashcards.xlsx", title: "Supabase", tag: "programming", description: "Postgres, auth, row level security, storage, edge functions and connecting an app." },
  { dir: "pbi", file: "Power BI Flashcards.xlsx", title: "Power BI", tag: "data", description: "Power Query, data modelling, DAX, visuals, publishing and row level security." },
  { dir: "etl", file: "ETL and Data Pipelines Flashcards.xlsx", title: "ETL and Data Pipelines", tag: "data", description: "Extract, transform and load, data quality, reliability and pipeline design." },
  { dir: "air", file: "Airflow Flashcards.xlsx", title: "Apache Airflow", tag: "data", description: "DAGs, operators, scheduling, retries and running Airflow well (written for Airflow 2, with Airflow 3 notes)." },
  { dir: "jup", file: "Jupyter Notebook Flashcards.xlsx", title: "Jupyter Notebook", tag: "data", description: "Cells, kernels, daily habits, reproducible notebooks and moving code into scripts." },
  { dir: "llm", file: "LLM APIs Flashcards.xlsx", title: "LLM APIs", tag: "artificial intelligence", description: "Tokens, prompting, API calls, tool use, quality and safety for apps built on language models." },
  { dir: "rag", file: "RAG Flashcards.xlsx", title: "RAG (Retrieval-Augmented Generation)", tag: "artificial intelligence", description: "Ingestion, chunking, embeddings, retrieval, generation and running RAG in production." },
  { dir: "evl", file: "AI Evaluation Flashcards.xlsx", title: "AI Evaluation", tag: "artificial intelligence", description: "Test sets, rubrics, LLM-as-judge, RAG and agent metrics, red teaming and eval harnesses." },
  { dir: "req", file: "Requirements and Customer Work Flashcards.xlsx", title: "Requirements and Customer Work", tag: "career skills", description: "Discovery, requirements, documentation and communication for customer-facing engineers." },
];

async function findAdmin(): Promise<string> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", suspendedAt: null, ...(email ? { email } : {}) },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!admin) {
    throw new Error(
      email
        ? `No active admin with the email ${email}. Check ADMIN_EMAIL, then run this again.`
        : "No admin account exists yet. Make your account an admin first, then run this again.",
    );
  }
  return admin.id;
}

async function main() {
  const adminId = await findAdmin();
  const failed: string[] = [];

  for (const d of DECKS) {
    const parsed = await parseCardsXlsx(readFileSync(join(ROOT, d.dir, d.file)));
    if (parsed.errors.length) {
      failed.push(`${d.title}: ${parsed.errors.slice(0, 3).join("; ")}`);
      continue;
    }
    const res = await importDeck(adminId, parsed.cards, { title: d.title, description: d.description, tags: [d.tag] });
    if ("error" in res) {
      failed.push(`${d.title}: ${res.error}`);
      continue;
    }
    console.log(`${d.title}: ${res.created} new, ${res.updated} updated`);
  }

  if (failed.length) {
    console.error(`\n${failed.length} deck(s) not loaded:\n- ${failed.join("\n- ")}`);
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
