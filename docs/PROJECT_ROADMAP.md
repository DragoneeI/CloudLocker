# CloudLocker

## Project Description

CloudLocker is a Smart Locker Management System hosted on AWS.

The system allows administrators to assign lockers to users while users access their lockers using facial recognition through a kiosk interface.

The project demonstrates cloud deployment, backend development, database management, REST APIs, and AWS services.

---

# System Components

## Backend

- FastAPI
- SQLAlchemy
- PostgreSQL

## Database

- Amazon RDS PostgreSQL

## Cloud Infrastructure

- Amazon EC2
- Amazon RDS
- VPC
- Internet Gateway
- GitHub

## Interfaces

### Admin Dashboard

- Manage users
- Manage lockers
- Assign lockers
- View logs

### Face Recognition Kiosk

- Detect user
- Open locker
- Finish using locker

### Virtual Locker Wall

- Display locker states
- Simulate physical lockers

---

# Database Tables

- Users
- Lockers
- Reservations
- Access Logs

---

# Current Progress

## Infrastructure

- [x] GitHub Repository
- [x] EC2 Instance
- [x] PostgreSQL RDS
- [x] VPC
- [x] Backend Deployment

## Backend

- [x] FastAPI Setup
- [x] Database Connection
- [x] Locker API
- [x] User API

## Remaining

- [ ] Reservations
- [ ] Access Logs
- [ ] Admin Dashboard
- [ ] Face Recognition
- [ ] Virtual Locker Wall
- [ ] Testing
