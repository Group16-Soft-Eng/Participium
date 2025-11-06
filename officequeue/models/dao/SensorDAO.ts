import { Entity, PrimaryColumn, Column, ManyToOne } from "typeorm";

import { GatewayDAO } from "./GatewayDAO";

@Entity("sensors")
export class SensorDAO {
  @PrimaryColumn({ nullable: false })
  macAddress: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  @Column({ nullable: false })
  variable: string;

  @Column({ nullable: false })
  unit: string;

  @ManyToOne(() => GatewayDAO, (gateway) => gateway.sensors, {onDelete: "CASCADE"})
  gateway: GatewayDAO;
}
