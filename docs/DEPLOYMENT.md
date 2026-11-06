# Deployment Design (AWS)

I didn't deploy this. This is how I would.

## Architecture

    Browser
       |
    CloudFront ---- /* ------> S3 (built React app)
       |
       | /api/*
       v
    Application Load Balancer
       |
    ECS Fargate (Express API container)
       |              |              |
    MongoDB Atlas   Anthropic API   Secrets Manager (DB URI, API key)

Images are stored in ECR and logs go to CloudWatch.

## Why these services

- **CloudFront and S3:** cheap hosting for static files. Routing `/api/*` through CloudFront keeps one origin, which matches the Vite proxy used in development, so no CORS setup is needed.
- **ECS Fargate:** runs the API as a container with no servers to manage. One small task is enough at this scale.
- **Application Load Balancer:** health checks using `/api/health`, and rolling deployments. Its default 60-second idle timeout is longer than the slowest summary call (20-second timeout, one retry).
- **MongoDB Atlas:** real MongoDB, so the Mongoose code runs unchanged. I chose it over Amazon DocumentDB, which is only MongoDB-compatible.
- **Secrets Manager:** keeps the API key and database URI out of the image and the repo.

## Rough monthly cost (USD)

| Item                                             | Demo             | Small production   |
| ------------------------------------------------ | ---------------- | ------------------ |
| Fargate (0.25 vCPU, 0.5 GB)                      | $9               | $9                 |
| Load balancer                                    | $18-22           | $18-22             |
| Public IPv4 addresses (3)                        | $11              | $11                |
| MongoDB Atlas                                    | $8-30 (Flex)     | about $60 (M10)    |
| S3, CloudFront, ECR, CloudWatch, Secrets Manager | $3-7             | $3-7               |
| Claude Haiku 5.5                                 | under $1         | under $1           |
| **Total**                                        | **about $50-80** | **about $100-110** |

The Claude estimate assumes about 1,000 input and 500 output tokens per summary, or about $0.35 per 1,000 summaries. Summaries are saved, so each candidate costs this once. I avoid a NAT gateway by giving the task a public IP, because a NAT gateway would add over $30.

## Before real use

Add authentication and rate limiting on the summary endpoint, which is the main cost risk, plus a build step in place of `tsx`, and Atlas backups.
