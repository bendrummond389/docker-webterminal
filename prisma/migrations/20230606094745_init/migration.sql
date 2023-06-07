-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "given_name" TEXT NOT NULL,
    "family_name" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "picture" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL,
    "sub" TEXT NOT NULL,
    "sid" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Container" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "info" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "namespace" TEXT NOT NULL,
    "deployment" TEXT NOT NULL,

    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
