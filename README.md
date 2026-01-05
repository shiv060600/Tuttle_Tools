# Customer Management Platform

Internal full-stack application for sales and finance teams to manage customer account mappings and warehouse fulfillment operations.

## Overview

Built an internal Node.js/React/React Query application containerized in Docker allowing staff to look up any customer, see the fulfilling warehouse and IDs, and drill into book-level inventory with on-hand quantity, backorder quantity, and daily sales, improving warehouse distribution and timely backorder fulfillment.

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- TanStack Query (React Query) for server state management
- React Hook Form for form handling
- Radix UI + Tailwind CSS + shadcn/ui components
- Vite for build tooling

**Backend:**
- Node.js + Express + TypeScript
- mssql driver for SQL Server connectivity
- Winston for logging
- CORS middleware

**Database:**
- SQL Server with connection pooling

**Deployment:**
- Docker + Docker Compose
- Multi-container architecture (frontend + backend)
- Alpine Linux base images for minimal footprint

## Key Features

- Customer account lookup and mapping management
- Real-time inventory data with on-hand and backorder quantities
- Warehouse distribution tracking
- Complete audit logging for compliance
- Time-based access control to prevent modifications during business hours
- Responsive, accessible UI built with modern component libraries

---

*Internal tool for operational use by sales and finance teams.*
