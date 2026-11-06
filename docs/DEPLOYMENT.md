# Deployment Design (AWS)

I ran the app locally and didn't deploy it. This is how I would deploy it, in **ap-southeast-2 (Sydney)**. Candidate resumes are personal information, so I'd store the data in Australia.

## Architecture

```
                    Browser
                       |
                   CloudFront
          /*  /                  \  /api/*  (response timeout raised to 60 s)
             v                    v
   S3 (private bucket,      Application Load Balancer
   built React app)          (2 AZs, health check /api/health)
                                  |
                       ECS Fargate: Express API container
                     (logs → CloudWatch, image ← ECR,
                      secrets injected from Secrets Manager)
                        |                         |
                 MongoDB Atlas              Anthropic API
                 (Sydney region)            (resume summaries)
```

**Deployments:** GitHub Actions would build the image, push it to ECR and update the ECS service.

## Why these services

- **CloudFront + S3:** cheap, fast hosting for the built React files. The bucket stays private, and only CloudFront can read it. Routing `/api/*` through the same domain gives one origin, the same as the Vite proxy in development, so no CORS setup is needed.
- **ECS Fargate:** runs the API as a container with no servers to manage. A 0.25 vCPU / 0.5 GB task is enough at this scale.
- **Application Load Balancer:** health checks and rolling deployments. `/api/health` shows the API is up. It also reports the database status, but returns 200 either way, so a database outage alone won't take tasks out of service.
- **Timeouts:** a summary call can take about 40 s (20 s timeout, one retry), so I'd raise CloudFront's 30 s origin timeout to 60 s on `/api/*`, matching the load balancer.
- **MongoDB Atlas:** real MongoDB, so the Mongoose code runs unchanged. I chose it over Amazon DocumentDB, which is only MongoDB-compatible.
- **Secrets Manager:** the Anthropic API key and database URI stay out of the image and the repo. ECS injects them as environment variables, so the app code is the same locally and on AWS.

## Networking and security

- **No NAT gateway**, which would add over $30/month. Tasks run in public subnets with a public IP, but their security group only accepts traffic from the load balancer.
- **Fargate to Atlas:** a Flex cluster doesn't support private networking, and the task's public IP changes on every deploy. So the demo's Atlas access list allows all IPs, relying on TLS and a strong, least-privilege database user. That's acceptable for sample data only. For production, I'd use an M10 cluster with VPC peering.
- **Data leaving AWS:** resume text is sent to the Anthropic API for summarising. Before real use, I'd confirm where that data is processed and stored, or call Claude through Amazon Bedrock if it's available in Sydney.

## Rough monthly cost (USD, Sydney estimates)

| Item                                                                 | Demo          | Small production         |
| -------------------------------------------------------------------- | ------------- | ------------------------ |
| Fargate (0.25 vCPU, 0.5 GB per task)                                 | ~$11 (1 task) | ~$22 (2 tasks, 2 AZs)    |
| Application Load Balancer (low traffic)                              | $19–24        | $19–24                   |
| Public IPv4 ($0.005/hour each: 2 for the load balancer + 1 per task) | ~$11 (3)      | ~$15 (4)                 |
| MongoDB Atlas                                                        | $8–30 (Flex)  | ~$60+ (M10, VPC peering) |
| S3, CloudFront, ECR, CloudWatch, Secrets Manager                     | $3–7          | $3–7                     |
| Claude Haiku 5.5                                                     | < $1          | < $1                     |
| **Total**                                                            | **~$50–85**   | **~$120–130+**           |

The Claude estimate assumes about 1,000 input and 500 output tokens per summary, or about $0.35 per 1,000 summaries, and each candidate is summarised once. I'd confirm all prices in the AWS Pricing Calculator before committing.

## Before real use

- **Authentication**, plus **rate limiting on the summary endpoint**, which is the main cost and abuse risk
- A **Dockerfile** and a build step (`tsc` to JavaScript) in place of `tsx`
- **Atlas backups** and **CloudWatch alarms** (5xx errors, unhealthy tasks, AI call failures)
