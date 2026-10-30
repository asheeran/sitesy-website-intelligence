# Sitesy Website Intelligence for MCP

Ten website and domain tools for AI agents, served by the Sitesy API at api.sitesy.ca and paid per call in USDC on Base through the x402 protocol. There is no account, no API key, and no subscription. Whoever runs this server pays for each call from their own wallet, which the server reads from an environment variable and never stores anywhere else.

## The tools

| Tool | What it returns | Price per call |
| --- | --- | --- |
| website_intelligence | A full report for one domain: public contact details, tech stack clues, transport security, response headers, DNS records, certificate basics, and hygiene findings with severities | 0.01 USDC |
| page_reader | Clean readable text and metadata extracted from one web page | 0.01 USDC |
| domain_profile | Registration basics, a DNS summary, and subdomains drawn from public certificate logs | 0.01 USDC |
| feed_reader | An RSS, Atom, or RDF feed normalized into dated items with summaries | 0.005 USDC |
| dns_lookup | The full DNS record set for one domain: A, AAAA, CNAME, MX, NS, TXT, SOA, CAA | 0.002 USDC |
| page_metadata | Title, description, canonical, Open Graph and Twitter card tags, icons, and structured data types from one web page | 0.002 USDC |
| sitemap | The sitemaps a domain declares and the page addresses inside them | 0.002 USDC |
| page_links | The links on one web page, split into internal and external, with anchor text | 0.002 USDC |
| site_check | A quick check: HTTPS reachability, HTTP behaviour, certificate days remaining, and security header presence | 0.001 USDC |
| redirect_trace | Every hop a web address takes, with each status and destination | 0.001 USDC |

## Quick start

Add the server to your MCP client configuration:

```json
{
  "mcpServers": {
    "sitesy-website-intelligence": {
      "command": "npx",
      "args": ["-y", "@getsitesy/website-intelligence"],
      "env": {
        "PAYER_PRIVATE_KEY": "0xYOUR_WALLET_PRIVATE_KEY"
      }
    }
  }
}
```

## Environment variables

PAYER_PRIVATE_KEY is required. It is the private key of the wallet that pays for calls. Use a wallet that holds only a small working balance of USDC on Base. Treat it the way you would treat any wallet key: keep it out of source control and out of shared configuration files.

API_URL is optional. It overrides the API base address and defaults to https://api.sitesy.ca.

## How payment works

Each tool call asks the API for its result. The API answers with an x402 payment request, this server signs a payment of the listed price from the configured wallet, and the API returns the result as the payment settles on Base. Prices are per call and there are no other charges from the API side.

## Safety notes

The tools read only what a normal visitor to a site receives, plus public DNS records, public registration data, and public certificate logs. The reader refuses addresses that resolve to private or local networks.

## License

MIT. See LICENSE.
