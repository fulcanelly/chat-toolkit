-- CreateTable
CREATE TABLE "User" (
    "id" BIGINT NOT NULL,
    "first_name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "State" (
    "id" SERIAL NOT NULL,
    "state" TEXT NOT NULL,
    "arguments" TEXT,
    "on_return_switch_to" TEXT,
    "on_return_switch_args" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "userId" BIGINT NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "eventName" TEXT NOT NULL,
    "data" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "stateId" INTEGER,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "State_userId_key" ON "State"("userId");

-- AddForeignKey
ALTER TABLE "State" ADD CONSTRAINT "State_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;
