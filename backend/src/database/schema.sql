-- SourceFlow Database Schema
-- This file is for reference. The actual schema is managed by Prisma.

-- Note: Prisma migrations will generate the actual SQL.
-- This file serves as documentation and can be used for manual database setup if needed.

-- Users table (managed by Prisma)
-- See prisma/schema.prisma for the complete schema definition

-- Key tables:
-- - users: User authentication and profiles
-- - products: Product metadata
-- - product_assets: Images/videos storage references
-- - boms: Bill of Materials
-- - bom_items: Individual BOM line items
-- - materials: Material catalog
-- - suppliers: Supplier database
-- - supplier_materials: Supplier-material relationships
-- - commodity_prices: Historical price data cache
-- - audit_logs: Compliance tracking (7-year retention)

-- Run Prisma migrations to create the actual schema:
-- npx prisma migrate dev --name init

