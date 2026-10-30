#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";

const API_URL = process.env.API_URL || "https://api.sitesy.ca";
const PAYER_PRIVATE_KEY = process.env.PAYER_PRIVATE_KEY;

if (!PAYER_PRIVATE_KEY) {
  console.error("PAYER_PRIVATE_KEY is not set. The MCP server pays for each call from the wallet of whoever runs it, so the operator sets their own key in the environment. It is never stored in this file.");
  process.exit(1);
}

const account = privateKeyToAccount(PAYER_PRIVATE_KEY);

const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [
    {
      network: "eip155:8453",
      client: new ExactEvmScheme(account)
    }
  ]
});

async function callPaid(path, paramName, value) {
  const url = `${API_URL}${path}?${paramName}=${encodeURIComponent(value)}`;
  const response = await fetchWithPayment(url, { method: "GET" });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || !data.report) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `The call failed with status ${response.status}: ${JSON.stringify(data).slice(0, 500)}`
        }
      ]
    };
  }
  return {
    content: [{ type: "text", text: JSON.stringify(data.report, null, 2) }]
  };
}

const server = new McpServer({
  name: "sitesy-website-intelligence",
  version: "1.0.0"
});

const domainArg = {
  domain: z.string().describe("A domain name, for example example.com")
};

server.registerTool(
  "website_intelligence",
  {
    description:
      "Fetch a website intelligence report for one domain from api.sitesy.ca. Returns public contact details the site publishes, tech stack clues, transport security, response headers, DNS records, certificate basics, and hygiene findings with severities. Costs 0.01 USDC per call on Base mainnet, paid automatically from the wallet configured in PAYER_PRIVATE_KEY.",
    inputSchema: domainArg
  },
  async ({ domain }) => callPaid("/v1/site-intelligence", "domain", domain)
);

server.registerTool(
  "page_reader",
  {
    description:
      "Extract clean readable text and metadata from one web page at api.sitesy.ca. Costs 0.01 USDC per call on Base mainnet, paid automatically from the wallet configured in PAYER_PRIVATE_KEY.",
    inputSchema: {
      url: z.string().describe("A web page address, for example https://example.com")
    }
  },
  async ({ url }) => callPaid("/v1/page-reader", "url", url)
);

server.registerTool(
  "domain_profile",
  {
    description:
      "Fetch a domain profile from api.sitesy.ca: registration basics, a DNS summary, and subdomains drawn from public certificate logs. Costs 0.01 USDC per call on Base mainnet, paid automatically from the wallet configured in PAYER_PRIVATE_KEY.",
    inputSchema: domainArg
  },
  async ({ domain }) => callPaid("/v1/domain-profile", "domain", domain)
);

server.registerTool(
  "dns_lookup",
  {
    description:
      "Fetch the full DNS record set for one domain from api.sitesy.ca: A, AAAA, CNAME, MX, NS, TXT, SOA, CAA. Costs 0.002 USDC per call on Base mainnet, paid automatically from the wallet configured in PAYER_PRIVATE_KEY.",
    inputSchema: domainArg
  },
  async ({ domain }) => callPaid("/v1/dns-lookup", "domain", domain)
);

server.registerTool(
  "site_check",
  {
    description:
      "Run a quick site check at api.sitesy.ca: HTTPS reachability, HTTP behaviour, certificate days remaining, and security header presence. Costs 0.001 USDC per call on Base mainnet, paid automatically from the wallet configured in PAYER_PRIVATE_KEY.",
    inputSchema: domainArg
  },
  async ({ domain }) => callPaid("/v1/site-check", "domain", domain)
);

const urlArg = {
  url: z.string().describe("A web address, for example https://example.com")
};

server.registerTool(
  "page_metadata",
  {
    description:
      "Fetch page metadata from api.sitesy.ca: title, description, canonical, Open Graph and Twitter card tags, icons, and structured data types from one web page. Costs 0.002 USDC per call on Base mainnet, paid automatically from the wallet configured in PAYER_PRIVATE_KEY.",
    inputSchema: urlArg
  },
  async ({ url }) => callPaid("/v1/page-metadata", "url", url)
);

server.registerTool(
  "feed_reader",
  {
    description:
      "Read a feed through api.sitesy.ca: an RSS, Atom, or RDF feed normalized into dated items with summaries. Costs 0.005 USDC per call on Base mainnet, paid automatically from the wallet configured in PAYER_PRIVATE_KEY.",
    inputSchema: {
      url: z.string().describe("A feed address, for example https://example.com/feed.xml")
    }
  },
  async ({ url }) => callPaid("/v1/feed-reader", "url", url)
);

server.registerTool(
  "sitemap",
  {
    description:
      "Fetch a domain's sitemaps from api.sitesy.ca and list the page addresses they declare. Costs 0.002 USDC per call on Base mainnet, paid automatically from the wallet configured in PAYER_PRIVATE_KEY.",
    inputSchema: domainArg
  },
  async ({ domain }) => callPaid("/v1/sitemap", "domain", domain)
);

server.registerTool(
  "redirect_trace",
  {
    description:
      "Trace a web address through api.sitesy.ca hop by hop, reporting every status and destination. Costs 0.001 USDC per call on Base mainnet, paid automatically from the wallet configured in PAYER_PRIVATE_KEY.",
    inputSchema: urlArg
  },
  async ({ url }) => callPaid("/v1/redirect-trace", "url", url)
);

server.registerTool(
  "page_links",
  {
    description:
      "Extract the links on one web page through api.sitesy.ca, split into internal and external, with anchor text. Costs 0.002 USDC per call on Base mainnet, paid automatically from the wallet configured in PAYER_PRIVATE_KEY.",
    inputSchema: urlArg
  },
  async ({ url }) => callPaid("/v1/page-links", "url", url)
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`sitesy MCP server running, API at ${API_URL}, payer ${account.address}`);
