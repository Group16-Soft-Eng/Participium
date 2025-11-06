import { Report } from './report';
import { State } from './state';
import { Officer } from './officer';


export interface ReportState { 
  Report?: Report;
  Approved?: State;
  Reason?: string;
  Officer?: Officer;
}
export namespace ReportState {
}


