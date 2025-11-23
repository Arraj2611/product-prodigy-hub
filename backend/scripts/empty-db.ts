/**
 * Script to empty all data from the database
 * WARNING: This will delete ALL data from ALL tables!
 * The schema and structure will remain intact.
 */
import prisma from '../src/config/database.js';
import logger from '../src/utils/logger.js';

async function emptyDatabase() {
  try {
    console.log('🗑️  Starting database cleanup...');
    
    // Delete in order to respect foreign key constraints
    // Start with tables that have foreign keys, then parent tables
    
    console.log('Deleting audit logs...');
    await prisma.auditLog.deleteMany({});
    
    console.log('Deleting market demand forecasts...');
    await prisma.marketDemandForecast.deleteMany({});
    
    console.log('Deleting material price forecasts...');
    await prisma.materialPriceForecast.deleteMany({});
    
    console.log('Deleting supplier materials...');
    await prisma.supplierMaterial.deleteMany({});
    
    console.log('Deleting supplier certifications...');
    await prisma.supplierCertification.deleteMany({});
    
    console.log('Deleting suppliers...');
    await prisma.supplier.deleteMany({});
    
    console.log('Deleting commodity prices...');
    await prisma.commodityPrice.deleteMany({});
    
    console.log('Deleting BOM versions...');
    await prisma.bOMVersion.deleteMany({});
    
    console.log('Deleting BOM items...');
    await prisma.bOMItem.deleteMany({});
    
    console.log('Deleting BOMs...');
    await prisma.bOM.deleteMany({});
    
    console.log('Deleting product assets...');
    await prisma.productAsset.deleteMany({});
    
    console.log('Deleting products...');
    await prisma.product.deleteMany({});
    
    console.log('Deleting materials...');
    await prisma.material.deleteMany({});
    
    console.log('Deleting notifications...');
    await prisma.notification.deleteMany({});
    
    console.log('Deleting sessions...');
    await prisma.session.deleteMany({});
    
    console.log('Deleting users...');
    await prisma.user.deleteMany({});
    
    console.log('✅ Database emptied successfully!');
    console.log('   All data has been deleted, but the schema remains intact.');
    
  } catch (error) {
    console.error('❌ Error emptying database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
emptyDatabase()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to empty database:', error);
    process.exit(1);
  });

