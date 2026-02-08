# Hexagonal Architecture & DDD Starter Kit

> A comprehensive guide to replicate the Notum Backend architecture in a new NestJS project.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Naming Conventions](#naming-conventions)
4. [Information Flow](#information-flow)
5. [Dependency Management](#dependency-management)
6. [Core Patterns & Code Examples](#core-patterns--code-examples)
7. [Module Template](#module-template)
8. [Cross-Cutting Concerns](#cross-cutting-concerns)
9. [Quick Reference Cheatsheet](#quick-reference-cheatsheet)

---

## Architecture Overview

This architecture combines three key patterns:

| Pattern                        | Purpose                                                         |
| ------------------------------ | --------------------------------------------------------------- |
| **Hexagonal Architecture**     | Isolate business logic from external concerns (DB, HTTP, etc.)  |
| **Domain-Driven Design (DDD)** | Rich domain models with business logic encapsulated in entities |
| **CQRS**                       | Separate read (Query) and write (Command) operations            |

### Core Principles

1. **Domain is King**: Business logic lives in domain entities, never in controllers or repositories
2. **Dependency Inversion**: Application layer defines ports (interfaces); Infrastructure implements adapters
3. **Validation at Boundaries**: Use Zod schemas to validate all external input
4. **Audit Everything**: Every entity tracks who created/modified/deleted it and when

---

## Folder Structure

### Root Layout

```
src/
├── app.module.ts              # Root module - orchestrates all modules
├── main.ts                    # Application entry point
├── core/                      # Shared infrastructure & cross-cutting concerns
├── modules/                   # Feature modules (bounded contexts)
└── shared/                    # Common utilities, value objects, constants
```

### Core Layer (`src/core/`)

Houses framework-agnostic utilities and cross-cutting concerns:

```
core/
├── abstractions/
│   ├── model.base.ts          # Base domain model interface (audit fields)
│   └── persistence.base.ts    # Base TypeORM entity (audit columns)
├── configs/
│   ├── general.config.ts      # Application configuration
│   ├── postgres-database.config.ts
│   └── data-source.config.ts  # TypeORM data source
├── decorators/
│   ├── requester.decorator.ts # Extract user from request
│   ├── public.decorator.ts    # Mark public routes
│   └── client.rpc.decorator.ts
├── features/
│   ├── auth/                  # Authentication guard & setup
│   ├── client/                # Microservices client configuration
│   └── seed/                  # Database seeding
├── errors/
│   ├── domain.error.ts        # Error factory functions
│   └── messages/              # Error message constants
├── filters/
│   ├── global-exception.filter.ts
│   └── rpc-exception.filter.ts
├── interceptors/
│   └── transform.interceptor.ts   # Response envelope wrapper
├── factories/
│   ├── query.factory.ts       # Dynamic Zod schema generation
│   └── select.factory.ts      # Dynamic SELECT clause building
├── builders/
│   ├── where.builder.ts       # Query WHERE clause builder
│   └── order.builder.ts       # Query ORDER BY builder
├── interfaces/
│   └── repository.interface.ts # Base repository port
├── schema/
│   ├── common.schema.ts       # Shared Zod schemas
│   └── query.schema.ts
└── types/
    └── common.type.ts         # Type definitions (Id, Email, etc.)
```

### Module Structure (`src/modules/[module-name]/`)

Each feature module follows strict hexagonal organization:

```
[module]/
├── [module].module.ts         # NestJS module definition
│
├── domain/                    # 🔵 DOMAIN LAYER
│   ├── entities/
│   │   └── [entity].entity.ts # Domain entity with business logic
│   ├── enums/
│   │   └── [name].enum.ts     # Business enumerations
│   ├── services/
│   │   └── [name].service.ts  # Domain services (stateless logic)
│   └── [module].error.ts      # Domain-specific error messages
│
├── application/               # 🟢 APPLICATION LAYER
│   ├── commands/
│   │   └── [action].command.ts    # Write operations (Create, Update, Delete)
│   ├── queries/
│   │   └── [action].query.ts      # Read operations (List, Detail)
│   ├── ports/
│   │   ├── [name].out.port.ts     # Outbound ports (repositories, external services)
│   │   └── [name].in.port.ts      # Inbound ports (DTOs, response types)
│   ├── [module].token.ts          # DI tokens (Symbols)
│   └── [module].dto.ts            # Zod schemas & DTOs
│
└── infrastructure/            # 🟠 INFRASTRUCTURE LAYER
    ├── controllers/
    │   └── [module].controller.ts # HTTP endpoints (primary adapter)
    ├── repositories/
    │   └── [name].repository.ts   # Database access (secondary adapter)
    ├── persistence/
    │   └── [entity].persistence.ts # TypeORM entity
    ├── mapper/
    │   └── [entity].mapper.ts     # Domain ↔ Persistence mapping
    ├── adapters/
    │   └── [name].adapter.ts      # External service adapters
    └── [module].rpc.ts            # RPC controller (microservices)
```

### Shared Layer (`src/shared/`)

```
shared/
├── vos/                       # Value Objects
│   ├── identifier.value.ts    # UUID v7 generation
│   └── temporal.value.ts      # Date/time utilities
├── utils/
│   ├── hash.util.ts           # Bcrypt hashing
│   └── pagination.util.ts
├── constants/
│   └── regex.constant.ts
└── enums/
    └── order-type.enum.ts
```

---

## Naming Conventions

### File Naming

| Layer            | Pattern                  | Example                        |
| ---------------- | ------------------------ | ------------------------------ |
| Domain Entity    | `[entity].entity.ts`     | `asset.entity.ts`              |
| Domain Service   | `[name].service.ts`      | `ownership.service.ts`         |
| Domain Error     | `[module].error.ts`      | `portfolio.error.ts`           |
| Command Handler  | `[action].command.ts`    | `create-asset.command.ts`      |
| Query Handler    | `[action].query.ts`      | `list-assets.query.ts`         |
| Port (Interface) | `[name].out.port.ts`     | `asset-repository.out.port.ts` |
| Adapter          | `[name].adapter.ts`      | `jwt.adapter.ts`               |
| Repository       | `[name].repository.ts`   | `asset.repository.ts`          |
| Persistence      | `[name].persistence.ts`  | `asset.persistence.ts`         |
| Mapper           | `[name].mapper.ts`       | `asset.mapper.ts`              |
| DTO/Schema       | `[module].dto.ts`        | `asset.dto.ts`                 |
| Tokens           | `[module].token.ts`      | `asset.token.ts`               |
| Controller       | `[module].controller.ts` | `asset.controller.ts`          |
| RPC Controller   | `[module].rpc.ts`        | `user.rpc.ts`                  |

### Class Naming

```typescript
// Domain Entities - PascalCase noun
class Asset {}
class Portfolio {}

// Handlers - [Action][Entity][Command/Query]Handler
class CreateAssetCommandHandler {}
class ListAssetsQueryHandler {}

// Repositories - [Entity]Repository
class AssetRepository {}

// Persistence - [Entity]Persistence
class AssetPersistence {}

// Adapters - [Name]Adapter
class JwtAdapter {}

// Services - [Descriptive]Service
class PortfolioOwnershipService {}

// Controllers - [Entity]Controller
class AssetController {}
```

### DI Token Pattern

```typescript
// src/modules/asset/application/asset.token.ts
export const ASSET_TOKENS = {
  REPOSITORIES: {
    ASSET: Symbol('ASSET.REPOSITORY.ASSET'),
    FINANCIAL_GOAL: Symbol('ASSET.REPOSITORY.FINANCIAL_GOAL'),
  },
  HANDLERS: {
    QUERY: {
      LIST: Symbol('ASSET.QUERY.LIST'),
    },
    COMMAND: {
      CREATE: Symbol('ASSET.COMMAND.CREATE'),
      UPDATE: Symbol('ASSET.COMMAND.UPDATE'),
      DELETE: Symbol('ASSET.COMMAND.DELETE'),
    },
  },
};
```

---

## Information Flow

### HTTP Request Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HTTP Request                                                           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  1. AuthenticateGuard                                                   │
│     - Validate JWT token                                                │
│     - Fetch user via RPC                                                │
│     - Attach user to request.user                                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2. Controller (Primary Adapter)                                        │
│     - Extract @Requester() user                                         │
│     - Extract @Body() or @Query() params                                │
│     - Dispatch to CommandBus / QueryBus                                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  3. Command/Query Handler (Application Layer)                           │
│     - Validate with Zod schema                                          │
│     - Orchestrate domain logic                                          │
│     - Call repository methods                                           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  4. Domain Entity                                                       │
│     - Execute business logic                                            │
│     - Enforce invariants                                                │
│     - Calculate derived values                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  5. Repository (Secondary Adapter)                                      │
│     - Use Mapper to convert Domain ↔ Persistence                        │
│     - Execute database operations                                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  6. TransformInterceptor                                                │
│     - Wrap response: { data: T, statusCode: number }                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  HTTP Response                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Detailed Example: Create Asset

**1. Controller**

```typescript
// src/modules/asset/infrastructure/controllers/asset.controller.ts
@Post()
async create(@Body() body: unknown, @Requester() user: IUser): Promise<Id> {
    return await this.commandBus.execute<CreateAssetCommand, Id>(
        new CreateAssetCommand({ dto: body, userId: user.id }),
    );
}
```

**2. Command Handler**

```typescript
// src/modules/asset/application/commands/create-asset.command.ts
@CommandHandler(CreateAssetCommand)
export class CreateAssetCommandHandler implements ICommandHandler<CreateAssetCommand, Id> {
  constructor(
    @Inject(ASSET_TOKENS.REPOSITORIES.ASSET)
    private readonly assetRepository: IAssetRepository
  ) {}

  async execute(command: CreateAssetCommand): Promise<Id> {
    const { dto, userId } = command.payload;

    // Validate input
    const { success, data, error } = AssetCreateSchema.safeParse(dto);
    if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

    // Create domain entity
    const asset = Asset.create(data, userId, userId);

    // Persist and return ID
    return await this.assetRepository.add(asset);
  }
}
```

**3. Domain Entity**

```typescript
// src/modules/asset/domain/entities/asset.entity.ts
export class Asset {
  readonly props: IAssetProps;

  private constructor(props: IAssetProps) {
    this.props = props;
  }

  static create(data: ICreateAssetPayload, userId: Id, createdById: Id): Asset {
    const id = IdentifierValue.v7();
    const now = TemporalValue.now;
    return new Asset({
      ...data,
      id,
      userId,
      createdById,
      updatedById: createdById,
      createdAt: now,
      updatedAt: now,
    });
  }

  static load(raw: IAssetProps): Asset {
    return new Asset(raw);
  }
}
```

**4. Repository**

```typescript
// src/modules/asset/infrastructure/repositories/asset.repository.ts
@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(
    @InjectRepository(AssetPersistence)
    private readonly repository: Repository<AssetPersistence>
  ) {}

  async add(asset: Asset): Promise<Id> {
    const persistence = AssetMapper.toPersistence(asset);
    const created = this.repository.create(persistence);
    const saved = await this.repository.save(created);
    return saved.id;
  }
}
```

**5. Mapper**

```typescript
// src/modules/asset/infrastructure/mapper/asset.mapper.ts
export class AssetMapper {
  static toPersistence(domain: Asset): DeepPartial<AssetPersistence> {
    return { ...domain.props };
  }

  static toDomain(entity: AssetPersistence): Asset {
    return Asset.load({ ...entity });
  }
}
```

---

## Dependency Management

### Port-Adapter Pattern

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                               │
│                                                                         │
│   ┌──────────────────────┐          ┌──────────────────────┐           │
│   │   Command Handler    │          │    Query Handler     │           │
│   └──────────┬───────────┘          └──────────┬───────────┘           │
│              │                                  │                       │
│              │         DEPENDS ON               │                       │
│              ▼                                  ▼                       │
│   ┌──────────────────────────────────────────────────────────┐         │
│   │              PORT (Interface)                             │         │
│   │              IAssetRepository                             │         │
│   └──────────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ IMPLEMENTED BY
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       INFRASTRUCTURE LAYER                              │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────┐         │
│   │              ADAPTER (Implementation)                     │         │
│   │              AssetRepository                              │         │
│   └──────────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Token-Based Dependency Injection

**1. Define Port (Interface)**

```typescript
// src/modules/asset/application/ports/asset-repository.out.port.ts
export type IAssetRepository = IRepository<Asset, AssetQueryDto> & {
  findByUserId(userId: Id, query: AssetQueryDto): Promise<Asset[]>;
};
```

**2. Define Tokens**

```typescript
// src/modules/asset/application/asset.token.ts
export const ASSET_TOKENS = {
  REPOSITORIES: {
    ASSET: Symbol('ASSET.REPOSITORY.ASSET'),
  },
};
```

**3. Implement Adapter**

```typescript
// src/modules/asset/infrastructure/repositories/asset.repository.ts
@Injectable()
export class AssetRepository implements IAssetRepository {
  // Implementation...
}
```

**4. Register in Module**

```typescript
// src/modules/asset/asset.module.ts
@Module({
  providers: [
    {
      provide: ASSET_TOKENS.REPOSITORIES.ASSET,
      useClass: AssetRepository,
    },
  ],
})
export class AssetModule {}
```

**5. Inject in Handler**

```typescript
// src/modules/asset/application/commands/create-asset.command.ts
constructor(
    @Inject(ASSET_TOKENS.REPOSITORIES.ASSET)
    private readonly assetRepository: IAssetRepository,
) {}
```

### Cross-Module Dependencies

When Module A needs data from Module B, use RPC or export tokens:

**Option 1: Export Token**

```typescript
// Module B exports its repository
@Module({
  exports: [PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO],
})
export class PortfolioModule {}

// Module A imports and uses it
@Module({
  imports: [PortfolioModule],
})
export class AssetModule {}
```

**Option 2: RPC Repository**

```typescript
// Create RPC adapter in Module A
@Injectable()
export class FinancialGoalRpcRepository implements IFinancialGoalRepository {
  constructor(@Inject(CLIENT_PROXY) private readonly client: ClientProxy) {}

  async getActive(userId: Id): Promise<FinancialGoal | null> {
    return await observableToPromise(this.client.send(FinancialGoalAction.GET_ACTIVE, userId));
  }
}
```

---

## Core Patterns & Code Examples

### Pattern 1: Domain Entity with Static Factories

```typescript
export class Asset {
  readonly props: IAssetProps;

  private constructor(props: IAssetProps) {
    this.props = props;
  }

  // Factory for NEW entities
  static create(data: ICreatePayload, userId: Id, createdById: Id): Asset {
    return new Asset({
      ...data,
      id: IdentifierValue.v7(),
      userId,
      createdById,
      updatedById: createdById,
      createdAt: TemporalValue.now,
      updatedAt: TemporalValue.now,
    });
  }

  // Factory for LOADING from persistence
  static load(raw: IAssetProps): Asset {
    return new Asset(raw);
  }

  // Domain method for updates
  update(data: IUpdatePayload, updatedById: Id): Asset {
    return new Asset({
      ...this.props,
      ...data,
      updatedById,
      updatedAt: TemporalValue.now,
    });
  }

  // Domain method for soft delete
  delete(deletedById: Id): Asset {
    return new Asset({
      ...this.props,
      deletedById,
      deletedAt: TemporalValue.now,
    });
  }

  // Calculated properties (business logic)
  get progress(): number {
    if (!this.props.targetValue) return 0;
    return (this.props.currentValue / this.props.targetValue) * 100;
  }
}
```

### Pattern 2: Zod Schema Validation

```typescript
// Define base schema
export const AssetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  currentValue: z.number().positive(),
  type: z.nativeEnum(AssetTypeEnum),
  userId: z.string().uuid(),
});

// Derive create schema (pick required fields)
export const AssetCreateSchema = AssetSchema.pick({
  name: true,
  currentValue: true,
  type: true,
});

// Derive update schema (all optional)
export const AssetUpdateSchema = AssetSchema.partial().omit({
  id: true,
  userId: true,
});

// Type inference
export type CreateAssetDto = z.infer<typeof AssetCreateSchema>;
```

### Pattern 3: Command/Query CQRS

```typescript
// Command (write operation)
export class CreateAssetCommand implements ICommand {
  constructor(public readonly payload: { dto: unknown; userId: Id }) {}
}

@CommandHandler(CreateAssetCommand)
export class CreateAssetCommandHandler implements ICommandHandler<CreateAssetCommand, Id> {
  async execute(command: CreateAssetCommand): Promise<Id> {
    // 1. Validate
    // 2. Create domain entity
    // 3. Persist
    // 4. Return ID
  }
}

// Query (read operation)
export class ListAssetsQuery implements IQuery {
  constructor(public readonly payload: { userId: Id; dto: AssetQueryDto }) {}
}

@QueryHandler(ListAssetsQuery)
export class ListAssetsQueryHandler implements IQueryHandler<ListAssetsQuery, Asset[]> {
  async execute(query: ListAssetsQuery): Promise<Asset[]> {
    // 1. Validate query params
    // 2. Fetch from repository
    // 3. Return results
  }
}
```

### Pattern 4: Mapper Pattern

```typescript
export class AssetMapper {
  // Domain → Persistence (for saving)
  static toPersistence(domain: Asset): DeepPartial<AssetPersistence> {
    return {
      ...domain.props,
      // Handle nested entities if needed
      target: domain.props.target?.props ?? null,
    };
  }

  // Persistence → Domain (for loading)
  static toDomain(entity: AssetPersistence): Asset {
    return Asset.load({
      ...entity,
      // Reconstruct nested entities
      target: entity.target ? AssetTarget.load(entity.target) : null,
    });
  }

  // Batch conversion
  static toDomainArray(entities: AssetPersistence[]): Asset[] {
    return entities.map((e) => this.toDomain(e));
  }
}
```

### Pattern 5: Base Repository Interface

```typescript
// src/core/interfaces/repository.interface.ts
export interface IRepositoryCommand<T> {
  add(entity: T): Promise<Id>;
  update(id: Id, entity: T): Promise<boolean>;
  remove(id: Id): Promise<boolean>;
}

export interface IRepositoryQuery<T, Search> {
  list(query?: Search): Promise<T[]>;
  paginatedList(query?: Search): Promise<PaginatedResponse<T>>;
  findById(id: Id): Promise<T | null>;
  findOne(conditions: Partial<T>): Promise<T | null>;
  exists(id: Id): Promise<boolean>;
}

export interface IRepository<T, Search>
  extends IRepositoryCommand<T>,
    IRepositoryQuery<T, Search> {}
```

### Pattern 6: Domain Service for Security

```typescript
// src/modules/portfolio/domain/services/portfolio-ownership.service.ts
export class PortfolioOwnershipService {
    static verifyOwnership(
        portfolio: Portfolio | null,
        userId: Id
    ): void {
        if (!portfolio) {
            throw NotFoundError(ERR_PORTFOLIO_NOT_FOUND);
        }
        if (portfolio.props.userId !== userId) {
            throw ForbiddenError(ERR_PORTFOLIO_ACCESS_DENIED);
        }
    }
}

// Usage in handler
async execute(query: PortfolioDetailQuery): Promise<Portfolio> {
    const portfolio = await this.repository.findById(query.payload.id);
    PortfolioOwnershipService.verifyOwnership(portfolio, query.payload.userId);
    return portfolio;
}
```

---

## Module Template

### Complete Module Scaffolding

```
my-feature/
├── my-feature.module.ts
├── domain/
│   ├── entities/
│   │   └── my-feature.entity.ts
│   ├── enums/
│   │   └── my-feature-status.enum.ts
│   ├── services/
│   │   └── my-feature-validation.service.ts
│   └── my-feature.error.ts
├── application/
│   ├── commands/
│   │   ├── create-my-feature.command.ts
│   │   ├── update-my-feature.command.ts
│   │   └── delete-my-feature.command.ts
│   ├── queries/
│   │   ├── list-my-features.query.ts
│   │   └── my-feature-detail.query.ts
│   ├── ports/
│   │   └── my-feature-repository.out.port.ts
│   ├── my-feature.token.ts
│   └── my-feature.dto.ts
└── infrastructure/
    ├── controllers/
    │   └── my-feature.controller.ts
    ├── repositories/
    │   └── my-feature.repository.ts
    ├── persistence/
    │   └── my-feature.persistence.ts
    └── mapper/
        └── my-feature.mapper.ts
```

### Module Registration Template

```typescript
// my-feature.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [TypeOrmModule.forFeature([MyFeaturePersistence]), CqrsModule],
  controllers: [MyFeatureController],
  providers: [
    // Repository
    {
      provide: MY_FEATURE_TOKENS.REPOSITORIES.MY_FEATURE,
      useClass: MyFeatureRepository,
    },
    // Command Handlers
    CreateMyFeatureCommandHandler,
    UpdateMyFeatureCommandHandler,
    DeleteMyFeatureCommandHandler,
    // Query Handlers
    ListMyFeaturesQueryHandler,
    MyFeatureDetailQueryHandler,
    // Domain Services
    MyFeatureValidationService,
  ],
  exports: [MY_FEATURE_TOKENS.REPOSITORIES.MY_FEATURE],
})
export class MyFeatureModule {}
```

---

## Cross-Cutting Concerns

### Global Exception Filter

```typescript
// src/core/filters/global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode: string | null = null;

    if (exception instanceof DomainError) {
      statusCode = exception.statusCode;
      message = exception.message;
      errorCode = exception.errorCode;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      message = exception.message;
    }

    response.status(statusCode).json({
      statusCode,
      errorCode,
      error: HttpStatus[statusCode],
      message,
    });
  }
}
```

### Response Transform Interceptor

```typescript
// src/core/interceptors/transform.interceptor.ts
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data: T) => ({
        data,
        statusCode: context.switchToHttp().getResponse().statusCode,
      }))
    );
  }
}
```

### Authentication Guard

```typescript
// src/core/features/auth/authenticate.guard.ts
@Injectable()
export class AuthenticateGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check for @Public() decorator
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) return true;

    // Extract and verify JWT
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    const payload = await this.jwtService.verify(token);
    const user = await this.fetchUser(payload.userId);

    // Attach user to request
    request.user = user;
    return true;
  }
}
```

### Requester Decorator

```typescript
// src/core/decorators/requester.decorator.ts
export const Requester = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);

// Usage in controller
@Get()
async list(@Requester() user: IUser): Promise<Asset[]> {
    return this.queryBus.execute(new ListAssetsQuery({ userId: user.id }));
}
```

---

## Quick Reference Cheatsheet

### Layer Responsibilities

| Layer              | Contains                                 | Depends On                    |
| ------------------ | ---------------------------------------- | ----------------------------- |
| **Domain**         | Entities, Value Objects, Domain Services | Nothing (pure business logic) |
| **Application**    | Commands, Queries, Ports, DTOs           | Domain                        |
| **Infrastructure** | Controllers, Repositories, Adapters      | Application, Domain           |

### File Quick Reference

| Need To...                  | Create File             | Location                       |
| --------------------------- | ----------------------- | ------------------------------ |
| Add business entity         | `[name].entity.ts`      | `domain/entities/`             |
| Add create/update/delete    | `[action].command.ts`   | `application/commands/`        |
| Add read operation          | `[action].query.ts`     | `application/queries/`         |
| Define repository interface | `[name].out.port.ts`    | `application/ports/`           |
| Implement database access   | `[name].repository.ts`  | `infrastructure/repositories/` |
| Add HTTP endpoints          | `[name].controller.ts`  | `infrastructure/controllers/`  |
| Define database schema      | `[name].persistence.ts` | `infrastructure/persistence/`  |

### Naming Patterns

| Concept  | Convention                      | Example                           |
| -------- | ------------------------------- | --------------------------------- |
| DI Token | `SCREAMING_SNAKE_CASE`          | `ASSET_TOKENS.REPOSITORIES.ASSET` |
| Entity   | `PascalCase`                    | `Asset`, `Portfolio`              |
| Handler  | `[Action][Entity][Type]Handler` | `CreateAssetCommandHandler`       |
| Port     | `I[Name]Repository`             | `IAssetRepository`                |
| Schema   | `[Entity][Action]Schema`        | `AssetCreateSchema`               |

### Validation Flow

```
1. Controller receives raw input (unknown type)
2. Pass to Command/Query handler
3. Handler validates with Zod: schema.safeParse(input)
4. On failure: throw BadRequestError with Zod errors
5. On success: use validated data to create domain entity
```

### Audit Fields (Every Entity)

```typescript
{
    id: string;          // UUID v7
    createdAt: string;   // ISO timestamp
    createdById: string; // User who created
    updatedAt: string;   // ISO timestamp
    updatedById: string; // User who last updated
    deletedAt?: string;  // Soft delete timestamp
    deletedById?: string;// User who deleted
}
```

---

## Getting Started Checklist

When creating a new module:

- [ ] Create module folder structure
- [ ] Define domain entity with `create()` and `load()` static methods
- [ ] Create Zod schemas in `[module].dto.ts`
- [ ] Define DI tokens in `[module].token.ts`
- [ ] Create repository port interface
- [ ] Implement repository adapter
- [ ] Create mapper for Domain ↔ Persistence
- [ ] Implement command handlers (Create, Update, Delete)
- [ ] Implement query handlers (List, Detail)
- [ ] Create controller with proper decorators
- [ ] Register all providers in module
- [ ] Add TypeORM persistence entity
- [ ] Create database migration

---

_This blueprint is based on the Notum Backend project architecture. Adapt patterns as needed for your specific requirements._
