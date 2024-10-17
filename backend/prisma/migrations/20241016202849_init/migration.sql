-- Enable the uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "orders_status_enum" AS ENUM ('pending', 'closed', 'canceled');

-- CreateEnum
CREATE TYPE "orders_type_enum" AS ENUM ('sell', 'buy');

-- CreateTable
CREATE TABLE "deals" (
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" SERIAL NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sellId" INTEGER NOT NULL,
    "buyId" INTEGER NOT NULL,

    CONSTRAINT "PK_8c66f03b250f613ff8615940b4b" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR NOT NULL,
    "originalName" VARCHAR,
    "context" VARCHAR,
    "mimetype" VARCHAR,
    "size" INTEGER,
    "ownerId" UUID,

    CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" SERIAL NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "headline" VARCHAR NOT NULL,
    "description" TEXT NOT NULL,
    "link" VARCHAR NOT NULL,
    "imageId" UUID,
    "stockId" UUID NOT NULL,

    CONSTRAINT "PK_39a43dfcb6007180f04aff2357e" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" SERIAL NOT NULL,
    "type" "orders_type_enum" NOT NULL,
    "status" "orders_status_enum" NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "initialQuantity" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "creatorId" UUID NOT NULL,
    "stockId" UUID NOT NULL,

    CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_items" (
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "stockId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "PK_c636df11b3cc98f390c8efc656a" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "logoId" UUID,
    "name" VARCHAR NOT NULL,
    "quantity" INTEGER NOT NULL,
    "nominalPrice" INTEGER NOT NULL,
    "information" TEXT NOT NULL,
    "members" INTEGER NOT NULL,
    "debutDate" DATE NOT NULL,
    "activeYears" INTEGER NOT NULL,
    "musicShowWins" INTEGER NOT NULL DEFAULT 0,
    "awardShowWins" INTEGER NOT NULL DEFAULT 0,
    "youtubeChannelViews" INTEGER NOT NULL DEFAULT 0,
    "monthlyStream" INTEGER NOT NULL DEFAULT 0,
    "albumPresales" INTEGER NOT NULL DEFAULT 0,
    "albumSales" INTEGER NOT NULL DEFAULT 0,
    "socialMedia" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PK_b5b1ee4ac914767229337974575" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading_activity" (
    "time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "stockId" UUID NOT NULL,
    "dealId" INTEGER NOT NULL,

    CONSTRAINT "PK_fdc629c75e80f88dfed2d3aa3b7" PRIMARY KEY ("time","token")
);

-- CreateTable
CREATE TABLE "users" (
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "roles" VARCHAR NOT NULL,
    "firstName" VARCHAR,
    "lastName" VARCHAR,
    "email" VARCHAR NOT NULL,
    "password" VARCHAR NOT NULL,
    "avatarId" UUID,

    CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "available" INTEGER NOT NULL DEFAULT 0,
    "userId" UUID NOT NULL,

    CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "REL_b1e5a455558381ffcf46be9eee" ON "news"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "user_stock" ON "portfolio_items"("userId", "stockId");

-- CreateIndex
CREATE UNIQUE INDEX "REL_1201811d2b2aa2e505c8f733b5" ON "stocks"("logoId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_cb547bdd2c2af241735260da520" ON "stocks"("name");

-- CreateIndex
CREATE INDEX "index_stock_time" ON "trading_activity"("stockId", "time" DESC);

-- CreateIndex
CREATE INDEX "trading_activity_time_idx" ON "trading_activity"("time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_97672ac88f789774dd47f7c8be3" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "REL_3e1f52ec904aed992472f2be14" ON "users"("avatarId");

-- CreateIndex
CREATE UNIQUE INDEX "REL_2ecdb33f23e9a6fc392025c0b9" ON "wallets"("userId");

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "FK_24fd7a617bc47487ee3366f8958" FOREIGN KEY ("sellId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "FK_5e112e050a1b5f3596776de4208" FOREIGN KEY ("buyId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "FK_a23484d1055e34d75b25f616792" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "FK_b1e5a455558381ffcf46be9eeee" FOREIGN KEY ("imageId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "FK_f0362a0fd0f890fff15737cf2f8" FOREIGN KEY ("stockId") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "FK_1ab8f93e87586de0fd3e4be8128" FOREIGN KEY ("stockId") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "FK_b40146eff5004cd1e86c15aa987" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "portfolio_items" ADD CONSTRAINT "FK_7ec721ebc4a2c3f8b31f45937fc" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "portfolio_items" ADD CONSTRAINT "FK_922e4dd6ba06e096ae8116171b3" FOREIGN KEY ("stockId") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "FK_1201811d2b2aa2e505c8f733b52" FOREIGN KEY ("logoId") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trading_activity" ADD CONSTRAINT "FK_69f7994da1f758683d47e50e85d" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trading_activity" ADD CONSTRAINT "FK_87b8d74ded964a5447a24a8bd71" FOREIGN KEY ("stockId") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "FK_3e1f52ec904aed992472f2be147" FOREIGN KEY ("avatarId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "FK_2ecdb33f23e9a6fc392025c0b97" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
