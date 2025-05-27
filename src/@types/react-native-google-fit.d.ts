declare module 'react-native-google-fit' {
  export const Scopes: {
    FITNESS_ACTIVITY_READ: string;
    FITNESS_BODY_READ: string;
  };

  export enum BucketUnit {
    DAY = 'DAY',
    HOUR = 'HOUR',
    MINUTE = 'MINUTE'
  }

  export interface GoogleFitOptions {
    scopes: string[];
  }

  export interface AuthResult {
    success: boolean;
  }

  export interface StepData {
    value: number;
    date: string;
  }

  export interface StepResponse {
    steps: StepData[];
  }

  interface GoogleFit {
    authorize(options: GoogleFitOptions): Promise<AuthResult>;
    getDailyStepCountSamples(options: {
      startDate: string;
      endDate: string;
      bucketUnit: BucketUnit;
      bucketInterval: number;
    }): Promise<StepResponse[]>;
  }

  const GoogleFit: GoogleFit;
  export default GoogleFit;
} 