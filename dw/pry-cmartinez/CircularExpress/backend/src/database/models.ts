// Single registry of every Sequelize model and association. Import it once (App, SeedersRunner, scripts)
// before syncing or querying, so all 11 tables and their foreign keys are always defined together.

// Models
import "../features/business/recyclers/recycler.model";
import "../features/business/routes/route.model";
import "../features/business/collection-points/collection-point.model";
import "../features/business/collections/collection.model";
import "../features/business/materials/material.model";
import "../features/business/material-rates/material-rate.model";
import "../features/business/plants/plant.model";
import "../features/business/material-lots/material-lot.model";
import "../features/business/weighings/weighing.model";
import "../features/business/material-sales/material-sale.model";
import "../features/business/settlements/settlement.model";

// Associations (must load after every model they reference)
import "../features/business/collection-points/collection-points.associations";
import "../features/business/collections/collections.associations";
import "../features/business/material-rates/material-rates.associations";
import "../features/business/material-lots/material-lots.associations";
import "../features/business/weighings/weighings.associations";
import "../features/business/material-sales/material-sales.associations";
import "../features/business/settlements/settlements.associations";
