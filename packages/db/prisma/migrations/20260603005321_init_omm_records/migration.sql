-- CreateTable
CREATE TABLE "omm_records" (
    "id" UUID NOT NULL,
    "norad_cat_id" TEXT NOT NULL,
    "object_id" TEXT,
    "object_name" TEXT,
    "classification_type" TEXT,
    "epoch" TIMESTAMP(3) NOT NULL,
    "mean_motion" DOUBLE PRECISION NOT NULL,
    "eccentricity" DOUBLE PRECISION NOT NULL,
    "inclination" DOUBLE PRECISION NOT NULL,
    "ra_of_asc_node" DOUBLE PRECISION NOT NULL,
    "arg_of_pericenter" DOUBLE PRECISION NOT NULL,
    "mean_anomaly" DOUBLE PRECISION NOT NULL,
    "ephemeris_type" INTEGER,
    "element_set_no" TEXT,
    "rev_at_epoch" TEXT,
    "bstar" DOUBLE PRECISION NOT NULL,
    "mean_motion_dot" DOUBLE PRECISION NOT NULL,
    "mean_motion_ddot" DOUBLE PRECISION NOT NULL,
    "raw_omm" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "omm_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "omm_records_norad_cat_id_idx" ON "omm_records"("norad_cat_id");

-- CreateIndex
CREATE INDEX "omm_records_object_id_idx" ON "omm_records"("object_id");

-- CreateIndex
CREATE UNIQUE INDEX "omm_records_norad_cat_id_epoch_key" ON "omm_records"("norad_cat_id", "epoch");
