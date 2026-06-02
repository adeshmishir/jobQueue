# ⚡ Distributed Job Queue System

A scalable distributed job processing system built using **Node.js, Redis, PostgreSQL, BullMQ, and Docker**.  
This project demonstrates real-world backend system design concepts like asynchronous processing, job queues, workers, retries, and fault tolerance.

---

## 🚀 Features

- Create and manage background jobs
- Asynchronous job processing using Redis Queue (BullMQ)
- Worker-based architecture for processing tasks
- PostgreSQL for persistent job storage
- Redis for in-memory queue management
- Scalable design with separation of API and worker logic
- Docker-based infrastructure setup
- REST API for job creation and monitoring

---

## 🏗️ System Architecture

```text
Client (Frontend)
      ↓
Express API Server
      ↓
Redis Queue (BullMQ)
      ↓
Worker Service
      ↓
PostgreSQL Database
