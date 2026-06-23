# Product Overview

## Project name
Matara Managment

## What this system is
Matara Managment is an internal business system for managing clients, projects, and project briefs.

## Core product direction
The main long-term product goal is not just management.
The real core product path is:

Project → Brief

## Business idea
This system is being built as a serious internal platform that may later become a sellable product for agencies, freelancers, or web professionals.

## Important product logic
- A Client is a separate entity
- A Project belongs to a Client
- A ProjectBrief belongs to a Project
- Every Project can have only one ProjectBrief
- The main entry point to a brief should be from the Projects table
- If a Project already has a Brief, it should open in edit mode
- If a Project does not have a Brief yet, it should open in create mode
- A new DB row for a Brief should only be created on first save, not on click

## Modules in the system
Current modules include:
- Projects
- Clients
- Project Briefs
- Leads
- Tasks
- Dashboard

But not all modules are equally important right now.

## What matters most right now
The most important path in the whole system is:
Project → Brief
