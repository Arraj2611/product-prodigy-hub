# AI Service Codebase Structure

This document describes the restructured codebase organization following best practices.

## Directory Structure

```
ai-service/
├── app/
│   ├── agents/                    # AI Agent implementations
│   │   ├── __init__.py
│   │   ├── product_analyzer.py
│   │   ├── material_analyzer.py
│   │   ├── manufacturing_analyzer.py
│   │   ├── pricing_analyzer.py
│   │   ├── orchestrator.py
│   │   ├── market_forecast_agent.py
│   │   ├── price_forecast_agent.py
│   │   ├── supplier_recommendations_agent.py
│   │   ├── supplier_contact_info_agent.py
│   │   ├── revenue_projection_agent.py
│   │   ├── product_performance_agent.py
│   │   ├── marketing_campaigns_agent.py
│   │   └── prompts/               # LangChain prompt templates
│   │       ├── product_analysis.py
│   │       ├── material_analysis.py
│   │       ├── manufacturing_analysis.py
│   │       ├── pricing_analysis.py
│   │       ├── market_forecast.py
│   │       ├── price_forecast.py
│   │       ├── supplier_recommendations.py
│   │       ├── supplier_contact_info.py
│   │       ├── revenue_projection.py
│   │       ├── product_performance.py
│   │       └── marketing_campaigns.py
│   │
│   ├── api/                       # FastAPI application
│   │   ├── app.py                 # FastAPI app factory
│   │   ├── config.py              # API configuration
│   │   ├── middleware/            # Custom middleware (empty for now)
│   │   ├── models/                # API request/response models
│   │   │   ├── __init__.py
│   │   │   ├── bom.py
│   │   │   ├── forecast.py
│   │   │   ├── supplier.py
│   │   │   └── product.py
│   │   └── routers/               # API route handlers
│   │       ├── __init__.py
│   │       ├── health.py          # Health check endpoint
│   │       └── inference.py      # AI inference endpoints
│   │
│   ├── models/                    # Business logic models
│   │   └── bom_generator.py      # BOM generation orchestrator
│   │
│   ├── services/                  # Business logic services
│   │   └── groq_service.py       # Groq API integration service
│   │
│   ├── utils/                     # Shared utilities
│   │   ├── __init__.py
│   │   └── error_handling.py     # Error handling utilities
│   │
│   ├── prompts/                   # Legacy prompts (deprecated, kept for compatibility)
│   │   └── __init__.py
│   │
│   └── main.py                    # Application entry point
│
└── requirements.txt
```

## Architecture Flow

```
Request → main.py → api/app.py → api/routers/ → services/ → agents/ → groq_service → Groq API
```

## Key Components

### 1. Agents (`app/agents/`)
- **Purpose**: Specialized AI agents for different tasks
- **Structure**: Each agent has its own file and uses LangChain prompts
- **Agents**:
  - Product Analysis: Analyzes product images
  - Material Analysis: Identifies materials
  - Manufacturing Analysis: Analyzes manufacturing processes
  - Pricing Analysis: Calculates costs
  - Market Forecast: Generates market demand forecasts
  - Price Forecast: Generates material price trends
  - Supplier Recommendations: Finds supplier companies
  - Supplier Contact Info: Finds supplier contact details
  - Revenue Projection: Generates revenue projections
  - Product Performance: Generates performance metrics
  - Marketing Campaigns: Generates marketing recommendations

### 2. API Layer (`app/api/`)
- **app.py**: FastAPI application factory
- **config.py**: Configuration management
- **models/**: Pydantic models for request/response validation
- **routers/**: Route handlers organized by functionality

### 3. Services (`app/services/`)
- **groq_service.py**: Main service for Groq API interactions
- Initializes and manages all agents
- Provides unified interface for AI operations

### 4. Models (`app/models/`)
- **bom_generator.py**: BOM generation orchestrator
- Uses the AnalysisOrchestrator to coordinate multiple agents

### 5. Utils (`app/utils/`)
- **error_handling.py**: Error handling utilities
- Reusable error handling functions

## Benefits of This Structure

1. **Separation of Concerns**: Clear separation between API, business logic, and AI agents
2. **Modularity**: Each component has a single responsibility
3. **Scalability**: Easy to add new agents, routes, or services
4. **Testability**: Each component can be tested independently
5. **Maintainability**: Clear organization makes code easier to understand and modify
6. **Best Practices**: Follows FastAPI and Python best practices

## Migration Notes

- All old `.txt` prompt files have been migrated to LangChain `.py` prompts
- All route handlers moved from `main.py` to `api/routers/`
- All request/response models moved to `api/models/`
- Configuration centralized in `api/config.py`
- FastAPI app creation moved to `api/app.py` factory function

