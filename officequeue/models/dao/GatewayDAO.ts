import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { NetworkDAO } from "./NetworkDAO";
import { SensorDAO } from "./SensorDAO";

@Entity("gateways")
export class GatewayDAO {
  @PrimaryColumn({ name: "mac_address", nullable: false })
  macAddress: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => SensorDAO, (sensor) => sensor.gateway)
  sensors: SensorDAO[];

  @ManyToOne(() => NetworkDAO, (network) => network.gateways, {nullable: false, onDelete: "CASCADE"})
  network: NetworkDAO;
}
