# 🚀 Cloud Migration Package

This folder contains everything needed to migrate the Agentic Search System from one Google Cloud Platform account to another.

## 📁 Contents

- **`CLOUD_MIGRATION_GUIDE.md`** - Complete step-by-step migration guide
- **`MIGRATION_SUMMARY.md`** - Quick reference and overview
- **`MIGRATION_CHECKLIST.md`** - Checklist to track migration progress
- **`scripts/migrate-to-new-cloud.sh`** - Automated migration script

## 🎯 Quick Start

### Option 1: Automated Migration (Recommended)

```bash
cd Move_New_Cloud
chmod +x scripts/migrate-to-new-cloud.sh
./scripts/migrate-to-new-cloud.sh
```

### Option 2: Manual Migration

Follow the detailed guide:
```bash
cat CLOUD_MIGRATION_GUIDE.md
```

## 📋 What This Migration Does

This migration package helps you:

1. ✅ Set up a new GCP project
2. ✅ Update all configuration files with new project ID
3. ✅ Build and push Docker images to new Container Registry
4. ✅ Deploy all services to Cloud Run in the new account
5. ✅ Configure service URLs and environment variables
6. ✅ Set up Vertex AI Matching Engine (optional)
7. ✅ Verify all services are working

## 🔧 Prerequisites

Before starting migration, ensure you have:

- [ ] New GCP project created
- [ ] Billing account linked to new project
- [ ] `gcloud` CLI installed and authenticated
- [ ] Docker installed and running
- [ ] Access to the codebase

## 📖 Documentation

1. **Start Here**: Read `MIGRATION_SUMMARY.md` for an overview
2. **Detailed Steps**: Follow `CLOUD_MIGRATION_GUIDE.md` for complete instructions
3. **Track Progress**: Use `MIGRATION_CHECKLIST.md` during migration

## 🚀 Migration Process

### Current Configuration
- **Project ID**: `future-of-search`
- **Project Number**: `188396315187`
- **Region**: `us-central1`
- **Storage Bucket**: `future-of-search-matching-engine-us-central1`

### What Gets Migrated

- **Services**: Simple Orchestrator, Query Processor, Frontend
- **Infrastructure**: Cloud Run, Cloud Storage, Vertex AI
- **Configuration**: All project IDs, URLs, environment variables

## ⚡ Quick Commands

```bash
# Run automated migration
./scripts/migrate-to-new-cloud.sh

# Or follow manual steps
cat CLOUD_MIGRATION_GUIDE.md
```

## 📝 After Migration

1. Verify all services are running
2. Test API endpoints
3. Update team documentation with new URLs
4. Set up monitoring and billing alerts
5. Test all features end-to-end

## 🆘 Support

- **Troubleshooting**: See `CLOUD_MIGRATION_GUIDE.md` - Troubleshooting section
- **Checklist**: Use `MIGRATION_CHECKLIST.md` to track progress
- **Quick Reference**: See `MIGRATION_SUMMARY.md` for commands

## 📚 Related Files

The migration will update these files in the main project:

- `docker-compose.yml`
- `frontend/cloudbuild.yaml`
- `services/query-processor/cloudbuild.yaml`
- `infrastructure/*.js` files
- `services/*/src/**/application.yml` files
- Various configuration files

---

**Ready to migrate?** Start with the automated script or follow the detailed guide!

