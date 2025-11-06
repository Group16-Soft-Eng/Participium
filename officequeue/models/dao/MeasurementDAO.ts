/* The only DAO is the single MeasurementDAO because:
- Stats is a DTO calculated on the fly (not stored) on Measurement
- Measurements is a DTO that contains the sensorMacAddress, the stats and the measurements
*/

/*
The fact that the Measurement DTO does not have the sensorMacAddress field is correct (Swagger wants it that way), but the DAO must have it for persistence and queries. So:
- MeasurementDTO: createdAt, value, isOutlier
- MeasurementDAO: createdAt, value, isOutlier, sensorMacAddress (for persistence)
- MeasurementsDTO: sensorMacAddress, stats, measurements
*/

import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class MeasurementDAO {
  @PrimaryGeneratedColumn()
  id: number;

  // @PrimaryColumn({ type: "varchar", length: 32 })
  @Column({ nullable: false })
  sensorMacAddress: string;

  // @PrimaryColumn()
  @Column({ nullable: false })
  @Index()
  createdAt: Date;

  @Column({ type: "float" })
  value: number;

  @Column({ type: "boolean", nullable: true })
  isOutlier?: boolean;
}
